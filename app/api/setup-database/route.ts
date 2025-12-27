import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // This endpoint initializes the database with seed data
    // Only run this once after deployment!

    console.log('Starting database setup...');

    // Check if already seeded
    const existingQueries = await prisma.query.count();
    if (existingQueries > 0) {
      return NextResponse.json({
        message: 'Database already initialized!',
        queries: existingQueries
      });
    }

    // Seed query templates
    const queryTemplates = [
      // MASTER QUERIES
      { name: 'MASTER: Video Editor (Generic)', baseQueryText: 'video editor hiring looking for', category: 'MASTER', isActive: true, isMaster: true },
      { name: 'MASTER: Short-form', baseQueryText: 'short form video editor hiring', category: 'MASTER', isActive: true, isMaster: true },
      { name: 'MASTER: Overflow/Backlog', baseQueryText: 'video editing backlog overflow need help', category: 'MASTER', isActive: true, isMaster: true },
      { name: 'MASTER: Repurposing', baseQueryText: 'repurpose long form content into clips shorts', category: 'MASTER', isActive: true, isMaster: true },

      // CATEGORY QUERIES
      { name: 'Agencies (hiring)', baseQueryText: 'agency hiring video editor', category: 'AGENCY', isActive: true, isMaster: false },
      { name: 'Agencies (overflow)', baseQueryText: 'agency video editing overflow', category: 'AGENCY', isActive: true, isMaster: false },
      { name: 'Podcasters', baseQueryText: 'podcast video editor hiring clips', category: 'PODCASTER', isActive: true, isMaster: false },
      { name: 'YouTube Creators', baseQueryText: 'youtuber hiring video editor', category: 'CREATOR', isActive: true, isMaster: false },
      { name: 'Coaches/Consultants', baseQueryText: 'coach consultant video editor', category: 'COACH', isActive: true, isMaster: false },
      { name: 'E-commerce (UGC/Ads)', baseQueryText: 'ecommerce ugc video ads editor', category: 'ECOM', isActive: true, isMaster: false },
      { name: 'Short-form Specialists', baseQueryText: 'short form reels tiktok editor', category: 'GENERAL', isActive: true, isMaster: false },
      { name: 'CapCut Editors', baseQueryText: 'capcut video editor hiring', category: 'GENERAL', isActive: true, isMaster: false },
      { name: 'Repurpose Long→Short', baseQueryText: 'repurpose youtube shorts clips', category: 'GENERAL', isActive: true, isMaster: false },
      { name: 'Urgent/Rush', baseQueryText: 'video editor needed asap urgent', category: 'GENERAL', isActive: true, isMaster: false },
      { name: 'Social Media Content', baseQueryText: 'social media video content editor', category: 'GENERAL', isActive: true, isMaster: false },
      { name: 'Interview/Talking Head', baseQueryText: 'interview podcast talking head editor', category: 'GENERAL', isActive: true, isMaster: false },
    ];

    for (const q of queryTemplates) {
      await prisma.query.create({ data: q });
    }

    // Seed DM templates
    const dmTemplates = [
      {
        name: 'DM1: Agency (Overflow)',
        templateBody: `Hey! Saw you're dealing with {pain_1} on video editing projects. We specialize in short-form content for agencies and can turn around {service} in {turnaround}. Interested in seeing samples?`,
        offerAngle: 'OVERFLOW_RELIEF',
        targetBuyerType: 'AGENCY',
        targetService: 'SHORT_FORM',
        isActive: true,
      },
      {
        name: 'DM1: Podcast (Clips)',
        templateBody: `Hi! Noticed you're looking for help with {service}. We do podcast clip packages (8-12 clips/episode) with {turnaround} turnaround. Want to see examples from similar shows?`,
        offerAngle: 'REPURPOSE_CONTENT',
        targetBuyerType: 'PODCASTER',
        targetService: 'PODCAST_CLIPS',
        isActive: true,
      },
      {
        name: 'DM1: Creator (YouTube→Shorts)',
        templateBody: `Hey! Saw you need {service}. We help creators repurpose long-form into Shorts/Reels (10-15 clips per video). {turnaround} delivery. Interested?`,
        offerAngle: 'REPURPOSE_CONTENT',
        targetBuyerType: 'CREATOR',
        targetService: 'SHORT_FORM',
        isActive: true,
      },
      {
        name: 'DM1: Generic (Short-form)',
        templateBody: `Hi! Saw you're looking for a {service} editor. We specialize in {buyer_type} content with {turnaround} turnaround. Would love to send over samples if you're interested!`,
        offerAngle: 'FAST_TURNAROUND',
        targetBuyerType: 'UNKNOWN',
        targetService: 'SHORT_FORM',
        isActive: true,
      },
      {
        name: 'FU1: Just checking in',
        templateBody: `Hey! Just wanted to follow up on my message about {service}. Still looking for help? Here's a quick sample of our work: {order_link}`,
        offerAngle: 'FAST_TURNAROUND',
        targetBuyerType: 'UNKNOWN',
        targetService: 'SHORT_FORM',
        isActive: true,
      },
    ];

    for (const t of dmTemplates) {
      await prisma.template.create({ data: t });
    }

    const queryCount = await prisma.query.count();
    const templateCount = await prisma.template.count();

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
      queries: queryCount,
      templates: templateCount
    });

  } catch (error: any) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}
