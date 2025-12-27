import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { name, baseQueryText, isActive } = body;

    const query = await prisma.query.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!query || query.userId !== session.user.id) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    const updatedQuery = await prisma.query.update({
      where: { id: resolvedParams.id },
      data: {
        ...(name !== undefined && { name }),
        ...(baseQueryText !== undefined && { baseQueryText }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ query: updatedQuery });
  } catch (error: any) {
    console.error('Error updating query:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
