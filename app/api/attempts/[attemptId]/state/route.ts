export const instant = false;
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { attemptId } = await params;
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const sd = attempt.sectionDeadlines as string[] | null;
  return NextResponse.json({ status: attempt.status, serverTime: new Date().toISOString(), deadline: sd?.[attempt.currentSectionIdx ?? 0] ?? attempt.deadline?.toISOString() });
}