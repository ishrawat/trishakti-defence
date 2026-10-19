import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const history = await prisma.attempt.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { mockTest: true },
      orderBy: { endTime: 'desc' }
    });

    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}