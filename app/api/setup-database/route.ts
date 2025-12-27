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

    // Create seed user for default templates
    const seedUser = await prisma.user.upsert({
      where: { email: 'seed@sff-lead-radar.internal' },
      update: {},
      create: {
        email: 'seed@sff-lead-radar.internal',
        name: 'Seed User',
      },
    });

    // Seed query templates (matching prisma/seed.ts)
    const queryTemplates = [
      { name: 'Master (Balanced)', category: 'MASTER', mappedService: 'SOCIAL_MEDIA_EDIT', baseQueryText: '("hiring" OR "looking for" OR "need an editor" OR "video editor needed") ("short form" OR reels OR shorts OR tiktok) (agency OR podcaster OR podcast OR coach OR consultant) (swamped OR overwhelmed OR backlog OR deadline OR turnaround OR urgent OR rush)' },
      { name: 'Hiring Now', category: 'HIRING_NOW', mappedService: 'SOCIAL_MEDIA_EDIT', baseQueryText: '(intitle:hiring OR intitle:"looking for" OR "editor needed") (shorts OR reels OR "short form" OR tiktok) ("video editor" OR editing)' },
      { name: 'Swamped', category: 'SWAMPED', mappedService: 'SOCIAL_MEDIA_EDIT', baseQueryText: '(swamped OR overwhelmed OR backlog OR "can\'t keep up" OR burnout) (editing OR "video editing" OR "making reels" OR "making shorts") (shorts OR reels OR tiktok)' },
      { name: 'Agency Overflow (Master)', category: 'AGENCY_OVERFLOW_MASTER', mappedService: 'SOCIAL_MEDIA_EDIT', baseQueryText: '(agency OR "white label" OR client OR overflow) ("need an editor" OR hiring OR "looking for") (reels OR shorts OR "short form")' },
      { name: '1. Podcast/YouTube Repurpose', category: 'PODCAST_REPURPOSE', mappedService: 'PODCAST_YOUTUBE_REPURPOSE', baseQueryText: '(podcast OR youtube) (repurpose OR clips OR shorts) ("need an editor" OR "looking for" OR hiring)' },
      { name: '2. Viral Captions', category: 'VIRAL_CAPTIONS', mappedService: 'VIRAL_CAPTIONS', baseQueryText: '(captions OR subtitles) ("word by word" OR dynamic OR engaging) (reels OR shorts)' },
      { name: '3. Smart Cut/Trim', category: 'SMART_CUT', mappedService: 'VIDEO_TRIM_SMART_CUT', baseQueryText: '("remove dead air" OR "tighten pacing" OR trim OR "cut down") (shorts OR reels)' },
      { name: '4. Rush', category: 'RUSH', mappedService: 'RUSH_12_HOUR', baseQueryText: '(rush OR urgent OR ASAP OR deadline OR "need it today") ("video editor" OR editing) (shorts OR reels)' },
      { name: '5. Agency Overflow', category: 'AGENCY_OVERFLOW', mappedService: 'SOCIAL_MEDIA_EDIT', baseQueryText: '(agency OR "white label" OR overflow OR client) ("need an editor" OR hiring) (shorts OR reels)' },
      { name: '6. Coaches/Consultants', category: 'COACHES_CONSULTANTS', mappedService: 'SOCIAL_MEDIA_EDIT', baseQueryText: '(coach OR consultant) ("need an editor" OR hiring) (reels OR shorts)' },
      { name: '7. Ecom/UGC Ads', category: 'ECOM_UGC', mappedService: 'AI_REEL_EDIT', baseQueryText: '(UGC OR "video ads" OR "creative testing" OR "ad fatigue") ("need an editor" OR "editor needed")' },
      { name: '8. Retention/Hook', category: 'RETENTION_HOOK', mappedService: 'SOCIAL_MEDIA_EDIT', baseQueryText: '("low retention" OR "drop off" OR "hook not working") (reels OR shorts OR tiktok)' },
      { name: '9. Batch Production', category: 'BATCH_PRODUCTION', mappedService: 'SOCIAL_MEDIA_EDIT', baseQueryText: '(batch OR batching) (shorts OR reels) (outsource OR editor OR help)' },
      { name: '10. Zero Views/Discovery', category: 'ZERO_VIEWS', mappedService: 'SOCIAL_MEDIA_EDIT', baseQueryText: '("zero views" OR shadowban OR "no views") (tiktok OR reels OR shorts) (help OR editor)' },
      { name: '11. Podcast Highlight Pain', category: 'PODCAST_HIGHLIGHTS', mappedService: 'PODCAST_YOUTUBE_REPURPOSE', baseQueryText: '(podcast OR interview) (highlights OR clips) ("takes too long" OR hours OR exhausting)' },
      { name: '12. Audio Problems', category: 'AUDIO_PROBLEMS', mappedService: 'AUTO_CAPTIONS', baseQueryText: '("background noise" OR echo OR desync OR "audio drift") (reels OR shorts OR podcast)' },
      { name: '13. Render/Export Issues', category: 'RENDER_ISSUES', mappedService: 'VIDEO_TRIM_SMART_CUT', baseQueryText: '("slow rendering" OR crash OR export) (4k OR "long video") (editing)' },
      { name: '14. Hiring Editor for Shorts', category: 'HIRING_SHORTS_EDITOR', mappedService: 'SOCIAL_MEDIA_EDIT', baseQueryText: '("shorts editor" OR "reels editor" OR "short form editor") (hiring OR "need an editor")' },
      { name: '15. Repurpose Long-form', category: 'REPURPOSE_LONGFORM', mappedService: 'PODCAST_YOUTUBE_REPURPOSE', baseQueryText: '("turn into shorts" OR "repurpose long form" OR "podcast to clips") ("need help" OR editor)' },
      { name: '16. General Need Editor', category: 'GENERAL_NEED_EDITOR', mappedService: 'SOCIAL_MEDIA_EDIT', baseQueryText: '("video editor needed" OR "need an editor" OR "looking for editor") (reels OR shorts OR tiktok)' },
    ];

    for (const template of queryTemplates) {
      await prisma.query.upsert({
        where: { id: `seed-${template.category}` },
        update: { ...template, userId: seedUser.id, engine: 'bing', isActive: true },
        create: { id: `seed-${template.category}`, ...template, userId: seedUser.id, engine: 'bing', isActive: true },
      });
    }

    // Seed DM templates (matching prisma/seed.ts)
    const dmTemplates = [
      { name: 'DM #1 - General (ANY)', type: 'DM_1', bodyText: 'Saw your post about {pain_1}. We do US/Canada done-for-you {service} with {turnaround} turnaround—want the order link?', applicableOfferAngle: 'ANY', applicableBuyerType: 'UNKNOWN', applicableService: 'UNKNOWN', priority: 10 },
      { name: 'DM #1 - Agency / Speed 48H', type: 'DM_1', bodyText: 'If you\'re swamped with client edits, we can take overflow shorts off your plate. US/Canada team, flat-rate {service}, {turnaround}—want the order link?', applicableOfferAngle: 'SPEED_48H', applicableBuyerType: 'AGENCY', applicableService: 'UNKNOWN', priority: 30 },
      { name: 'DM #1 - Podcaster / Repurpose', type: 'DM_1', bodyText: 'If turning long-form into clips is eating your time, we can handle it. US/Canada done-for-you {service}—want the order link?', applicableOfferAngle: 'ANY', applicableBuyerType: 'PODCASTER', applicableService: 'PODCAST_YOUTUBE_REPURPOSE', priority: 30 },
      { name: 'Follow-up #1 - General', type: 'FU_1', bodyText: 'Quick ping—still need help with {service}? I can send the order link + turnaround options.', applicableOfferAngle: 'ANY', applicableBuyerType: 'UNKNOWN', applicableService: 'UNKNOWN', priority: 10 },
      { name: 'Follow-up #2 - General', type: 'FU_2', bodyText: 'Last check—if you\'re still swamped, we can start as soon as you send the footage/link. Want the order link?', applicableOfferAngle: 'ANY', applicableBuyerType: 'UNKNOWN', applicableService: 'UNKNOWN', priority: 10 },
    ];

    for (const template of dmTemplates) {
      await prisma.template.upsert({
        where: { id: `seed-${template.type}-${template.priority}` },
        update: { ...template, userId: seedUser.id, isActive: true },
        create: { id: `seed-${template.type}-${template.priority}`, ...template, userId: seedUser.id, isActive: true },
      });
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
