import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canonicalizeUrl, extractDomain } from '@/lib/canonicalize';
import { scoreLead } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { urls, queryId } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }

    if (urls.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 URLs allowed per import' },
        { status: 400 }
      );
    }

    // Get query for service mapping
    const query = queryId
      ? await prisma.query.findUnique({ where: { id: queryId } })
      : null;

    const mappedService = query?.mappedService || 'UNKNOWN';

    // Get settings
    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    });

    let imported = 0;
    let duplicates = 0;

    for (const url of urls) {
      try {
        const { canonical, hash } = canonicalizeUrl(url);
        const sourceHost = extractDomain(url);

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
          await prisma.lead.update({
            where: { id: existing.id },
            data: { lastSeenAt: new Date() },
          });
          duplicates++;
          continue;
        }

        // For manual imports, we don't have title/snippet from API
        // Use placeholder values - user can click through to see the actual post
        const title = `Manual Import: ${sourceHost}`;
        const snippet = `Manually imported from ${url}`;

        // Score with minimal info
        const scoringResult = scoreLead(
          title,
          snippet,
          sourceHost,
          settings?.jobBoardBlocklist || []
        );

        // Create lead with REVIEW status (since we don't have full content)
        await prisma.lead.create({
          data: {
            userId: session.user.id,
            originalUrl: url,
            canonicalUrl: canonical,
            urlHash: hash,
            title,
            snippet,
            sourceHost,
            buyerType: scoringResult.buyerType,
            painTags: scoringResult.painTags,
            mappedService,
            score: 50, // Neutral score for manual imports
            status: 'REVIEW', // Always review manual imports
            rush12HourEligible: false,
          },
        });

        imported++;
      } catch (error) {
        console.error(`Failed to import URL ${url}:`, error);
        // Continue with other URLs
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      duplicates,
    });
  } catch (error: any) {
    console.error('Manual import error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
