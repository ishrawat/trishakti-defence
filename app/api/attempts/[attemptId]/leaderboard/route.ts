import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { attemptId } = await params;
  
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const topAttempts = await prisma.attempt.findMany({
    where: { mockTestId: attempt.mockTestId, status: 'COMPLETED' },
    orderBy: { totalScore: 'desc' },
    take: 50,
    include: { user: { select: { name: true } } }
  });

  return NextResponse.json(topAttempts.map((a, i) => ({
    rank: i + 1,
    name: a.user.name,
    score: a.totalScore,
    isMe: a.userId === auth.userId
  })));
}