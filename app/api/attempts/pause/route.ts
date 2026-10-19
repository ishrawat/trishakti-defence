import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { attemptId } = await req.json();
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (attempt.status !== 'IN_PROGRESS') return NextResponse.json({ error: 'Not active' }, { status: 409 });

  await prisma.attempt.update({
    where: { id: attemptId },
    data: { pausedAt: new Date(), pauseCount: { increment: 1 } }
  });

  return NextResponse.json({ ok: true, serverTime: new Date().toISOString() });
}