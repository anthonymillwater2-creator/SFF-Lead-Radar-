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

    const queries = await prisma.query.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ queries });
  } catch (error: any) {
    console.error('Error fetching queries:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
