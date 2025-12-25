import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildFinalQuery } from '@/lib/source-packs';
import { canonicalizeUrl, extractDomain } from '@/lib/canonicalize';
import { scoreLead } from '@/lib/scoring';
import { SourcePack } from '@prisma/client';

interface BingSearchResult {
  name: string;
  url: string;
  snippet: string;
  displayUrl?: string;
}

interface BingSearchResponse {
  webPages?: {
    value: BingSearchResult[];
    totalEstimatedMatches?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { queryId, sourcePack, market = 'en-US', freshness = 'Week' } = body;

    if (!queryId || !sourcePack) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get user settings
    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      return NextResponse.json(
        { error: 'User settings not found' },
        { status: 404 }
      );
    }

    // Rate limiting checks
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check per-query daily limit
    const todayRunsForQuery = await prisma.run.count({
      where: {
        userId: session.user.id,
        queryId,
        startedAt: { gte: todayStart },
      },
    });

    if (todayRunsForQuery >= settings.queryMaxRunsPerDay) {
      return NextResponse.json(
        { error: `Daily run limit reached for this query (${settings.queryMaxRunsPerDay})` },
        { status: 429 }
      );
    }

    // Check global cooldown
    const lastRun = await prisma.run.findFirst({
      where: { userId: session.user.id },
      orderBy: { finishedAt: 'desc' },
    });

    if (lastRun?.finishedAt) {
      const minutesSinceLastRun =
        (now.getTime() - lastRun.finishedAt.getTime()) / 1000 / 60;
      if (minutesSinceLastRun < settings.globalCooldownMinutes) {
        const remainingMinutes = Math.ceil(
          settings.globalCooldownMinutes - minutesSinceLastRun
        );
        return NextResponse.json(
          { error: `Please wait ${remainingMinutes} minute(s) before running another search` },
          { status: 429 }
        );
      }
    }

    // Get query template
    const query = await prisma.query.findUnique({
      where: { id: queryId },
    });

    if (!query || query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    // Create run record
    const run = await prisma.run.create({
      data: {
        userId: session.user.id,
        queryId,
        sourcePack: sourcePack as SourcePack,
        market,
        freshness,
      },
    });

    // Build final query
    const finalQuery = buildFinalQuery(
      query.baseQueryText,
      sourcePack as SourcePack,
      settings.jobBoardBlocklist
    );

    // Call Bing Web Search API
    const bingApiKey = process.env.BING_SEARCH_API_KEY;
    const bingEndpoint = process.env.BING_SEARCH_ENDPOINT || 'https://api.bing.microsoft.com/v7.0/search';

    if (!bingApiKey) {
      throw new Error('BING_SEARCH_API_KEY not configured');
    }

    const searchUrl = new URL(bingEndpoint);
    searchUrl.searchParams.set('q', finalQuery);
    searchUrl.searchParams.set('responseFilter', 'Webpages');
    searchUrl.searchParams.set('count', settings.maxResultsPerRun.toString());
    searchUrl.searchParams.set('offset', '0');
    searchUrl.searchParams.set('mkt', market);
    searchUrl.searchParams.set('setLang', market);
    searchUrl.searchParams.set('freshness', freshness);

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Ocp-Apim-Subscription-Key': bingApiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bing API error: ${response.status} ${errorText}`);
    }

    const data: BingSearchResponse = await response.json();

    if (data.error) {
      throw new Error(`Bing API error: ${data.error.code} - ${data.error.message}`);
    }

    const results = data.webPages?.value || [];

    // Process results
    let totalResults = 0;
    let qualifiedResults = 0;
    let reviewResults = 0;
    let rejectedResults = 0;
    let duplicatesRemoved = 0;

    for (const result of results) {
      totalResults++;

      const { canonical, hash } = canonicalizeUrl(result.url);
      const sourceHost = extractDomain(result.url);

      // Check for duplicate
      const existing = await prisma.lead.findUnique({
        where: {
          userId_canonicalUrl: {
            userId: session.user.id,
            canonicalUrl: canonical,
          },
        },
      });

      if (existing) {
        // Update last seen
        await prisma.lead.update({
          where: { id: existing.id },
          data: { lastSeenAt: now },
        });
        duplicatesRemoved++;
        continue;
      }

      // Score the lead
      const scoringResult = scoreLead(
        result.name,
        result.snippet,
        sourceHost,
        settings.jobBoardBlocklist
      );

      // Create lead
      await prisma.lead.create({
        data: {
          userId: session.user.id,
          originalUrl: result.url,
          canonicalUrl: canonical,
          urlHash: hash,
          title: result.name,
          snippet: result.snippet,
          sourceHost,
          buyerType: scoringResult.buyerType,
          painTags: scoringResult.painTags,
          mappedService: query.mappedService,
          score: scoringResult.score,
          status: scoringResult.status,
          overrideReason: scoringResult.overrideReason,
          rush12HourEligible: scoringResult.rush12HourEligible,
        },
      });

      // Count by status
      if (scoringResult.status === 'OUTREACH_READY') qualifiedResults++;
      else if (scoringResult.status === 'REVIEW') reviewResults++;
      else if (scoringResult.status === 'REJECTED') rejectedResults++;
    }

    // Update run record
    await prisma.run.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        totalResults,
        qualifiedResults,
        reviewResults,
        rejectedResults,
        duplicatesRemoved,
      },
    });

    return NextResponse.json({
      success: true,
      runId: run.id,
      totalResults,
      qualifiedResults,
      reviewResults,
      rejectedResults,
      duplicatesRemoved,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
