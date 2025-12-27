import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Run the entire schema creation as raw SQL
    await prisma.$executeRawUnsafe(`
      -- Create enums
      DO $$ BEGIN
        CREATE TYPE "QueryCategory" AS ENUM ('PODCAST_REPURPOSE', 'VIRAL_CAPTIONS', 'SMART_CUT', 'RUSH', 'AGENCY_OVERFLOW', 'COACHES_CONSULTANTS', 'ECOM_UGC', 'RETENTION_HOOK', 'BATCH_PRODUCTION', 'ZERO_VIEWS', 'PODCAST_HIGHLIGHTS', 'AUDIO_PROBLEMS', 'RENDER_ISSUES', 'HIRING_SHORTS_EDITOR', 'REPURPOSE_LONGFORM', 'GENERAL_NEED_EDITOR', 'MASTER', 'HIRING_NOW', 'SWAMPED', 'AGENCY_OVERFLOW_MASTER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "MappedService" AS ENUM ('AI_REEL_EDIT', 'SOCIAL_MEDIA_EDIT', 'VIRAL_CAPTIONS', 'PODCAST_YOUTUBE_REPURPOSE', 'AUTO_CAPTIONS', 'VIDEO_TRIM_SMART_CUT', 'RUSH_12_HOUR', 'UNKNOWN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "SourcePack" AS ENUM ('FORUMS', 'SOCIAL', 'PROFESSIONAL', 'WIDE_WEB');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "BuyerType" AS ENUM ('AGENCY', 'PODCASTER', 'COACH', 'ECOM', 'CREATOR', 'UNKNOWN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "LeadStatus" AS ENUM ('OUTREACH_READY', 'REVIEW', 'REJECTED', 'CONTACTED', 'REPLIED', 'BOOKED', 'WON', 'LOST', 'NO_RESPONSE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "OverrideReason" AS ENUM ('SELLER_POST', 'TOO_OLD', 'WRONG_NICHE', 'JOB_BOARD', 'LOW_INTENT', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "OfferAngle" AS ENUM ('FIXED_PRICE', 'SPEED_48H', 'LOCAL_US_CA', 'RUSH_12H', 'ANY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "LeadEventType" AS ENUM ('STATUS_CHANGE', 'DM_1_SENT', 'FU_1_SENT', 'FU_2_SENT', 'OUTREACH_SENT', 'FOLLOWUP_SENT', 'REPLY_RECEIVED', 'BOOKED', 'WON', 'LOST', 'NOTE_ADDED', 'SNOOZED', 'OVERRIDE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "TemplateType" AS ENUM ('DM_1', 'FU_1', 'FU_2');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create tables
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "emailVerified" TIMESTAMP(3),
          "name" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "Account" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "provider" TEXT NOT NULL,
          "providerAccountId" TEXT NOT NULL,
          "refresh_token" TEXT,
          "access_token" TEXT,
          "expires_at" INTEGER,
          "token_type" TEXT,
          "scope" TEXT,
          "id_token" TEXT,
          "session_state" TEXT,
          CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "Session" (
          "id" TEXT NOT NULL,
          "sessionToken" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "VerificationToken" (
          "identifier" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Settings" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "orderPageUrl" TEXT NOT NULL DEFAULT '',
          "utmSource" TEXT NOT NULL DEFAULT 'leadgen_app',
          "utmMedium" TEXT NOT NULL DEFAULT 'outreach',
          "maxResultsPerRun" INTEGER NOT NULL DEFAULT 50,
          "queryMaxRunsPerDay" INTEGER NOT NULL DEFAULT 5,
          "globalCooldownMinutes" INTEGER NOT NULL DEFAULT 2,
          "jobBoardBlocklist" TEXT[] DEFAULT ARRAY[]::TEXT[],
          "fu1DelayHours" INTEGER NOT NULL DEFAULT 48,
          "fu2DelayHours" INTEGER NOT NULL DEFAULT 96,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "Query" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "engine" TEXT NOT NULL DEFAULT 'bing',
          "category" "QueryCategory" NOT NULL,
          "mappedService" "MappedService" NOT NULL,
          "baseQueryText" TEXT NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Query_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "Run" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "queryId" TEXT NOT NULL,
          "sourcePack" "SourcePack" NOT NULL,
          "market" TEXT NOT NULL DEFAULT 'en-US',
          "freshness" TEXT NOT NULL DEFAULT 'Week',
          "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "finishedAt" TIMESTAMP(3),
          "totalResults" INTEGER NOT NULL DEFAULT 0,
          "qualifiedResults" INTEGER NOT NULL DEFAULT 0,
          "reviewResults" INTEGER NOT NULL DEFAULT 0,
          "rejectedResults" INTEGER NOT NULL DEFAULT 0,
          "duplicatesRemoved" INTEGER NOT NULL DEFAULT 0,
          "error" TEXT,
          CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "Lead" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "originalUrl" TEXT NOT NULL,
          "canonicalUrl" TEXT NOT NULL,
          "urlHash" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "snippet" TEXT NOT NULL,
          "sourceHost" TEXT NOT NULL,
          "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "dateUnknown" BOOLEAN NOT NULL DEFAULT true,
          "buyerType" "BuyerType" NOT NULL DEFAULT 'UNKNOWN',
          "painTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
          "mappedService" "MappedService" NOT NULL DEFAULT 'UNKNOWN',
          "offerAngle" "OfferAngle" NOT NULL DEFAULT 'ANY',
          "score" INTEGER NOT NULL DEFAULT 0,
          "status" "LeadStatus" NOT NULL DEFAULT 'REVIEW',
          "forcedStatusOverride" "LeadStatus",
          "overrideReason" "OverrideReason",
          "lastOutreachAt" TIMESTAMP(3),
          "nextFollowUpAt" TIMESTAMP(3),
          "rush12HourEligible" BOOLEAN NOT NULL DEFAULT false,
          "notes" TEXT NOT NULL DEFAULT '',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "LeadEvent" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "leadId" TEXT NOT NULL,
          "eventType" "LeadEventType" NOT NULL,
          "payloadJson" TEXT NOT NULL DEFAULT '{}',
          "messagePreview" TEXT,
          "templateId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE IF NOT EXISTS "Template" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "type" "TemplateType" NOT NULL,
          "bodyText" TEXT NOT NULL,
          "applicableOfferAngle" "OfferAngle" NOT NULL DEFAULT 'ANY',
          "applicableBuyerType" "BuyerType" NOT NULL DEFAULT 'UNKNOWN',
          "applicableService" "MappedService" NOT NULL DEFAULT 'UNKNOWN',
          "priority" INTEGER NOT NULL DEFAULT 0,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
      CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
      CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
      CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
      CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
      CREATE UNIQUE INDEX IF NOT EXISTS "Settings_userId_key" ON "Settings"("userId");
      CREATE UNIQUE INDEX IF NOT EXISTS "Lead_userId_canonicalUrl_key" ON "Lead"("userId", "canonicalUrl");

      CREATE INDEX IF NOT EXISTS "Query_userId_isActive_idx" ON "Query"("userId", "isActive");
      CREATE INDEX IF NOT EXISTS "Run_userId_startedAt_idx" ON "Run"("userId", "startedAt");
      CREATE INDEX IF NOT EXISTS "Run_queryId_idx" ON "Run"("queryId");
      CREATE INDEX IF NOT EXISTS "Lead_userId_status_idx" ON "Lead"("userId", "status");
      CREATE INDEX IF NOT EXISTS "Lead_userId_nextFollowUpAt_idx" ON "Lead"("userId", "nextFollowUpAt");
      CREATE INDEX IF NOT EXISTS "Lead_urlHash_idx" ON "Lead"("urlHash");
      CREATE INDEX IF NOT EXISTS "LeadEvent_leadId_createdAt_idx" ON "LeadEvent"("leadId", "createdAt");
      CREATE INDEX IF NOT EXISTS "LeadEvent_userId_createdAt_idx" ON "LeadEvent"("userId", "createdAt");
      CREATE INDEX IF NOT EXISTS "Template_userId_type_isActive_idx" ON "Template"("userId", "type", "isActive");
    `);

    // Add foreign keys
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "Query" ADD CONSTRAINT "Query_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "Run" ADD CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "Run" ADD CONSTRAINT "Run_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Query"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    return NextResponse.json({
      success: true,
      message: 'Database schema created successfully! All tables are ready.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to create schema',
        message: error.message,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
