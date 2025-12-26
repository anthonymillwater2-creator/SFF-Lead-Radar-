import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LeadEventType } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventType, messagePreview, templateId } = body;

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead || lead.userId !== session.user.id) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get settings for follow-up timing
    const settings = await prisma.settings.findUnique({
      where: { userId: session.user.id },
    });

    const now = new Date();
    let nextFollowUpAt: Date | null = null;
    let newStatus = lead.status;

    // Auto-schedule follow-ups based on event type
    if (eventType === 'DM_1_SENT') {
      nextFollowUpAt = new Date(now.getTime() + (settings?.fu1DelayHours || 48) * 60 * 60 * 1000);
      newStatus = 'CONTACTED';
    } else if (eventType === 'FU_1_SENT') {
      const fu2Delay = (settings?.fu2DelayHours || 96) - (settings?.fu1DelayHours || 48);
      nextFollowUpAt = new Date(now.getTime() + fu2Delay * 60 * 60 * 1000);
    } else if (eventType === 'FU_2_SENT') {
      nextFollowUpAt = null;
      newStatus = 'NO_RESPONSE';
    } else if (['REPLY_RECEIVED', 'BOOKED', 'WON', 'LOST'].includes(eventType)) {
      nextFollowUpAt = null;
      if (eventType === 'REPLY_RECEIVED') newStatus = 'REPLIED';
      else if (eventType === 'BOOKED') newStatus = 'BOOKED';
      else if (eventType === 'WON') newStatus = 'WON';
      else if (eventType === 'LOST') newStatus = 'LOST';
    }

    // Create event
    await prisma.leadEvent.create({
      data: {
        userId: session.user.id,
        leadId: id,
        eventType: eventType as LeadEventType,
        messagePreview,
        templateId,
        payloadJson: JSON.stringify(body),
      },
    });

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: newStatus,
        lastOutreachAt: now,
        nextFollowUpAt,
        updatedAt: now,
      },
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (error: any) {
    console.error('Error creating lead event:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
