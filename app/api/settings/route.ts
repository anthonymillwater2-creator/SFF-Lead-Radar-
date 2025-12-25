import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const settings = await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: {
        orderPageUrl: body.orderPageUrl || '',
        utmSource: body.utmSource || 'leadgen_app',
        utmMedium: body.utmMedium || 'outreach',
        maxResultsPerRun: body.maxResultsPerRun || 50,
        queryMaxRunsPerDay: body.queryMaxRunsPerDay || 5,
        globalCooldownMinutes: body.globalCooldownMinutes || 2,
        jobBoardBlocklist: body.jobBoardBlocklist || [],
        fu1DelayHours: body.fu1DelayHours || 48,
        fu2DelayHours: body.fu2DelayHours || 96,
      },
      create: {
        userId: session.user.id,
        orderPageUrl: body.orderPageUrl || '',
        utmSource: body.utmSource || 'leadgen_app',
        utmMedium: body.utmMedium || 'outreach',
        maxResultsPerRun: body.maxResultsPerRun || 50,
        queryMaxRunsPerDay: body.queryMaxRunsPerDay || 5,
        globalCooldownMinutes: body.globalCooldownMinutes || 2,
        jobBoardBlocklist: body.jobBoardBlocklist || [],
        fu1DelayHours: body.fu1DelayHours || 48,
        fu2DelayHours: body.fu2DelayHours || 96,
      },
    });

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
