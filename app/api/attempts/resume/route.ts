import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { attemptId } = await req.json();
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!attempt.pausedAt) return NextResponse.json({ error: 'Not paused' }, { status: 400 });

  const pausedMs = Math.max(0, new Date().getTime() - attempt.pausedAt.getTime());
  const newDeadline = attempt.deadline ? new Date(attempt.deadline.getTime() + pausedMs) : null;

  await prisma.attempt.update({
    where: { id: attempt.id },
    data: { pausedAt: null, pausedDurationMs: { increment: pausedMs }, deadline: newDeadline }
  });

  return NextResponse.json({ deadline: newDeadline?.toISOString(), serverTime: new Date().toISOString() });
}