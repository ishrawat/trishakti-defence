import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { attemptId, questionId, selectedOption, status, timeSpent } = await req.json();
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (attempt.deadline && new Date() > attempt.deadline) return NextResponse.json({ expired: true }, { status: 409 });
  const existing = await prisma.response.findFirst({ where: { attemptId, questionId } });
  const data = { selectedOption: selectedOption ?? null, status: status ?? 'NOT_ANSWERED', timeSpent: Math.max(0, Number(timeSpent) || 0) };
  if (existing) await prisma.response.update({ where: { id: existing.id }, data });
  else await prisma.response.create({ data: { attemptId, questionId, ...data } });
  return NextResponse.json({ ok: true, deadline: attempt.deadline?.toISOString() });
}