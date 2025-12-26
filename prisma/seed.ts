import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Find or create a seed user (for default templates)
  const seedUser = await prisma.user.upsert({
    where: { email: 'seed@sff-lead-radar.internal' },
    update: {},
    create: {
      email: 'seed@sff-lead-radar.internal',
      name: 'Seed User',
    },
  });

  console.log('✅ Seed user created/found:', seedUser.email);

  // Default query templates
  const queryTemplates = [
    // Master queries (4)
    {
      name: 'Master (Balanced)',
      category: 'MASTER' as const,
      mappedService: 'SOCIAL_MEDIA_EDIT' as const,
      baseQueryText:
        '("hiring" OR "looking for" OR "need an editor" OR "video editor needed") ("short form" OR reels OR shorts OR tiktok) (agency OR podcaster OR podcast OR coach OR consultant) (swamped OR overwhelmed OR backlog OR deadline OR turnaround OR urgent OR rush)',
    },
    {
      name: 'Hiring Now',
      category: 'HIRING_NOW' as const,
      mappedService: 'SOCIAL_MEDIA_EDIT' as const,
      baseQueryText:
        '(intitle:hiring OR intitle:"looking for" OR "editor needed") (shorts OR reels OR "short form" OR tiktok) ("video editor" OR editing)',
    },
    {
      name: 'Swamped',
      category: 'SWAMPED' as const,
      mappedService: 'SOCIAL_MEDIA_EDIT' as const,
      baseQueryText:
        '(swamped OR overwhelmed OR backlog OR "can\'t keep up" OR burnout) (editing OR "video editing" OR "making reels" OR "making shorts") (shorts OR reels OR tiktok)',
    },
    {
      name: 'Agency Overflow (Master)',
      category: 'AGENCY_OVERFLOW_MASTER' as const,
      mappedService: 'SOCIAL_MEDIA_EDIT' as const,
      baseQueryText:
        '(agency OR "white label" OR client OR overflow) ("need an editor" OR hiring OR "looking for") (reels OR shorts OR "short form")',
    },

    // 16 Category queries
    {
      name: '1. Podcast/YouTube Repurpose',
      category: 'PODCAST_REPURPOSE' as const,
      mappedService: 'PODCAST_YOUTUBE_REPURPOSE' as const,
      baseQueryText:
        '(podcast OR youtube) (repurpose OR clips OR shorts) ("need an editor" OR "looking for" OR hiring)',
    },
    {
      name: '2. Viral Captions',
      category: 'VIRAL_CAPTIONS' as const,
      mappedService: 'VIRAL_CAPTIONS' as const,
      baseQueryText:
        '(captions OR subtitles) ("word by word" OR dynamic OR engaging) (reels OR shorts)',
    },
    {
      name: '3. Smart Cut/Trim',
      category: 'SMART_CUT' as const,
      mappedService: 'VIDEO_TRIM_SMART_CUT' as const,
      baseQueryText:
        '("remove dead air" OR "tighten pacing" OR trim OR "cut down") (shorts OR reels)',
    },
    {
      name: '4. Rush',
      category: 'RUSH' as const,
      mappedService: 'RUSH_12_HOUR' as const,
      baseQueryText:
        '(rush OR urgent OR ASAP OR deadline OR "need it today") ("video editor" OR editing) (shorts OR reels)',
    },
    {
      name: '5. Agency Overflow',
      category: 'AGENCY_OVERFLOW' as const,
      mappedService: 'SOCIAL_MEDIA_EDIT' as const,
      baseQueryText:
        '(agency OR "white label" OR overflow OR client) ("need an editor" OR hiring) (shorts OR reels)',
    },
    {
      name: '6. Coaches/Consultants',
      category: 'COACHES_CONSULTANTS' as const,
      mappedService: 'SOCIAL_MEDIA_EDIT' as const,
      baseQueryText:
        '(coach OR consultant) ("need an editor" OR hiring) (reels OR shorts)',
    },
    {
      name: '7. Ecom/UGC Ads',
      category: 'ECOM_UGC' as const,
      mappedService: 'AI_REEL_EDIT' as const,
      baseQueryText:
        '(UGC OR "video ads" OR "creative testing" OR "ad fatigue") ("need an editor" OR "editor needed")',
    },
    {
      name: '8. Retention/Hook',
      category: 'RETENTION_HOOK' as const,
      mappedService: 'SOCIAL_MEDIA_EDIT' as const,
      baseQueryText:
        '("low retention" OR "drop off" OR "hook not working") (reels OR shorts OR tiktok)',
    },
    {
      name: '9. Batch Production',
      category: 'BATCH_PRODUCTION' as const,
      mappedService: 'SOCIAL_MEDIA_EDIT' as const,
      baseQueryText:
        '(batch OR batching) (shorts OR reels) (outsource OR editor OR help)',
    },
    {
      name: '10. Zero Views/Discovery',
      category: 'ZERO_VIEWS' as const,
      mappedService: 'SOCIAL_MEDIA_EDIT' as const,
      baseQueryText:
        '("zero views" OR shadowban OR "no views") (tiktok OR reels OR shorts) (help OR editor)',
    },
    {
      name: '11. Podcast Highlight Pain',
      category: 'PODCAST_HIGHLIGHTS' as const,
      mappedService: 'PODCAST_YOUTUBE_REPURPOSE' as const,
      baseQueryText:
        '(podcast OR interview) (highlights OR clips) ("takes too long" OR hours OR exhausting)',
    },
    {
      name: '12. Audio Problems',
      category: 'AUDIO_PROBLEMS' as const,
      mappedService: 'AUTO_CAPTIONS' as const,
      baseQueryText:
        '("background noise" OR echo OR desync OR "audio drift") (reels OR shorts OR podcast)',
    },
    {
      name: '13. Render/Export Issues',
      category: 'RENDER_ISSUES' as const,
      mappedService: 'VIDEO_TRIM_SMART_CUT' as const,
      baseQueryText:
        '("slow rendering" OR crash OR export) (4k OR "long video") (editing)',
    },
    {
      name: '14. Hiring Editor for Shorts',
      category: 'HIRING_SHORTS_EDITOR' as const,
      mappedService: 'SOCIAL_MEDIA_EDIT' as const,
      baseQueryText:
        '("shorts editor" OR "reels editor" OR "short form editor") (hiring OR "need an editor")',
    },
    {
      name: '15. Repurpose Long-form',
      category: 'REPURPOSE_LONGFORM' as const,
      mappedService: 'PODCAST_YOUTUBE_REPURPOSE' as const,
      baseQueryText:
        '("turn into shorts" OR "repurpose long form" OR "podcast to clips") ("need help" OR editor)',
    },
    {
      name: '16. General Need Editor',
      category: 'GENERAL_NEED_EDITOR' as const,
      mappedService: 'SOCIAL_MEDIA_EDIT' as const,
      baseQueryText:
        '("video editor needed" OR "need an editor" OR "looking for editor") (reels OR shorts OR tiktok)',
    },
  ];

  console.log('📋 Creating query templates...');

  for (const template of queryTemplates) {
    await prisma.query.upsert({
      where: {
        id: `seed-${template.category}`,
      },
      update: {
        ...template,
        userId: seedUser.id,
        engine: 'bing',
        isActive: true,
      },
      create: {
        id: `seed-${template.category}`,
        ...template,
        userId: seedUser.id,
        engine: 'bing',
        isActive: true,
      },
    });
  }

  console.log('✅ Query templates created:', queryTemplates.length);

  // Default DM templates
  const dmTemplates = [
    {
      name: 'DM #1 - General (ANY)',
      type: 'DM_1' as const,
      bodyText:
        'Saw your post about {pain_1}. We do US/Canada done-for-you {service} with {turnaround} turnaround—want the order link?',
      applicableOfferAngle: 'ANY' as const,
      applicableBuyerType: 'UNKNOWN' as const,
      applicableService: 'UNKNOWN' as const,
      priority: 10,
    },
    {
      name: 'DM #1 - Agency / Speed 48H',
      type: 'DM_1' as const,
      bodyText:
        'If you\'re swamped with client edits, we can take overflow shorts off your plate. US/Canada team, flat-rate {service}, {turnaround}—want the order link?',
      applicableOfferAngle: 'SPEED_48H' as const,
      applicableBuyerType: 'AGENCY' as const,
      applicableService: 'UNKNOWN' as const,
      priority: 30,
    },
    {
      name: 'DM #1 - Podcaster / Repurpose',
      type: 'DM_1' as const,
      bodyText:
        'If turning long-form into clips is eating your time, we can handle it. US/Canada done-for-you {service}—want the order link?',
      applicableOfferAngle: 'ANY' as const,
      applicableBuyerType: 'PODCASTER' as const,
      applicableService: 'PODCAST_YOUTUBE_REPURPOSE' as const,
      priority: 30,
    },
    {
      name: 'Follow-up #1 - General',
      type: 'FU_1' as const,
      bodyText:
        'Quick ping—still need help with {service}? I can send the order link + turnaround options.',
      applicableOfferAngle: 'ANY' as const,
      applicableBuyerType: 'UNKNOWN' as const,
      applicableService: 'UNKNOWN' as const,
      priority: 10,
    },
    {
      name: 'Follow-up #2 - General',
      type: 'FU_2' as const,
      bodyText:
        'Last check—if you\'re still swamped, we can start as soon as you send the footage/link. Want the order link?',
      applicableOfferAngle: 'ANY' as const,
      applicableBuyerType: 'UNKNOWN' as const,
      applicableService: 'UNKNOWN' as const,
      priority: 10,
    },
  ];

  console.log('💬 Creating DM templates...');

  for (const template of dmTemplates) {
    await prisma.template.upsert({
      where: {
        id: `seed-${template.type}-${template.priority}`,
      },
      update: {
        ...template,
        userId: seedUser.id,
        isActive: true,
      },
      create: {
        id: `seed-${template.type}-${template.priority}`,
        ...template,
        userId: seedUser.id,
        isActive: true,
      },
    });
  }

  console.log('✅ DM templates created:', dmTemplates.length);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
