export const instant = false;
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth';


export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const attempts = await prisma.attempt.findMany({
      where: { userId, status: 'COMPLETED' },
      include: { mockTest: { include: { exam: true } } },
      orderBy: { endTime: 'desc' }
    });

    return NextResponse.json(attempts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}