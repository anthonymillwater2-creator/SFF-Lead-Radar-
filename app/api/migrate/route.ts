import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Running database migration and seed...');

    // Test database connection and check if tables exist
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error);
      return NextResponse.json(
        { error: 'Database connection failed', details: error },
        { status: 500 }
      );
    }

    // Check if User table exists by trying to count
    let tablesExist = false;
    try {
      await prisma.user.count();
      tablesExist = true;
      console.log('Tables already exist');
    } catch (error) {
      console.log('Tables do not exist, need to create schema');
    }

    if (!tablesExist) {
      return NextResponse.json({
        error: 'Database tables not created',
        message: 'Please run: npx prisma db push --accept-data-loss',
        instruction: 'The database schema needs to be pushed first. This cannot be done via API endpoint in production.'
      }, { status: 500 });
    }

    // Check if already seeded
    const existingQueries = await prisma.query.count();
    if (existingQueries > 0) {
      return NextResponse.json({
        success: true,
        message: 'Database already initialized!',
        queries: existingQueries,
        tables: 'exist'
      });
    }

    // Create seed user
    const seedUser = await prisma.user.upsert({
      where: { email: 'seed@sff-lead-radar.internal' },
      update: {},
      create: {
        email: 'seed@sff-lead-radar.internal',
        name: 'Seed User',
      },
    });

    console.log('Seed user created');

    // Seed query templates
    const queryTemplates = [
      { name: 'Master (Balanced)', category: 'MASTER' as const, mappedService: 'SOCIAL_MEDIA_EDIT' as const, baseQueryText: '("hiring" OR "looking for" OR "need an editor" OR "video editor needed") ("short form" OR reels OR shorts OR tiktok) (agency OR podcaster OR podcast OR coach OR consultant) (swamped OR overwhelmed OR backlog OR deadline OR turnaround OR urgent OR rush)' },
      { name: 'Hiring Now', category: 'HIRING_NOW' as const, mappedService: 'SOCIAL_MEDIA_EDIT' as const, baseQueryText: '(intitle:hiring OR intitle:"looking for" OR "editor needed") (shorts OR reels OR "short form" OR tiktok) ("video editor" OR editing)' },
      { name: 'Swamped', category: 'SWAMPED' as const, mappedService: 'SOCIAL_MEDIA_EDIT' as const, baseQueryText: '(swamped OR overwhelmed OR backlog OR "can\'t keep up" OR burnout) (editing OR "video editing" OR "making reels" OR "making shorts") (shorts OR reels OR tiktok)' },
      { name: 'Agency Overflow (Master)', category: 'AGENCY_OVERFLOW_MASTER' as const, mappedService: 'SOCIAL_MEDIA_EDIT' as const, baseQueryText: '(agency OR "white label" OR client OR overflow) ("need an editor" OR hiring OR "looking for") (reels OR shorts OR "short form")' },
    ];

    for (const template of queryTemplates) {
      await prisma.query.upsert({
        where: { id: `seed-${template.category}` },
        update: { ...template, userId: seedUser.id, engine: 'bing', isActive: true },
        create: { id: `seed-${template.category}`, ...template, userId: seedUser.id, engine: 'bing', isActive: true },
      });
    }

    console.log(`Created ${queryTemplates.length} query templates`);

    //Seed DM templates
    const dmTemplates = [
      { name: 'DM #1 - General (ANY)', type: 'DM_1' as const, bodyText: 'Saw your post about {pain_1}. We do US/Canada done-for-you {service} with {turnaround} turnaround—want the order link?', applicableOfferAngle: 'ANY' as const, applicableBuyerType: 'UNKNOWN' as const, applicableService: 'UNKNOWN' as const, priority: 10 },
      { name: 'Follow-up #1 - General', type: 'FU_1' as const, bodyText: 'Quick ping—still need help with {service}? I can send the order link + turnaround options.', applicableOfferAngle: 'ANY' as const, applicableBuyerType: 'UNKNOWN' as const, applicableService: 'UNKNOWN' as const, priority: 10 },
    ];

    for (const template of dmTemplates) {
      await prisma.template.upsert({
        where: { id: `seed-${template.type}-${template.priority}` },
        update: { ...template, userId: seedUser.id, isActive: true },
        create: { id: `seed-${template.type}-${template.priority}`, ...template, userId: seedUser.id, isActive: true },
      });
    }

    console.log(`Created ${dmTemplates.length} DM templates`);

    const queryCount = await prisma.query.count();
    const templateCount = await prisma.template.count();

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
      queries: queryCount,
      templates: templateCount,
      seedUser: seedUser.email
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Setup failed',
        details: error.stack
      },
      { status: 500 }
    );
  }
}
