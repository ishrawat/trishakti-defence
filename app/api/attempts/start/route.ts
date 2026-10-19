import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
function stripAnswer(q: any) { const { correctOption, explanation, ...safe } = q; return safe; }
export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth || auth.role !== 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { testId } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  const mockTest = await prisma.mockTest.findFirst({ where: { id: testId, batches: { some: { id: user?.batchId! } } }, include: { sections: { orderBy: { id: 'asc' }, include: { questions: { orderBy: { id: 'asc' } } } } } });
  if (!mockTest) return NextResponse.json({ error: 'Test not available' }, { status: 404 });
  const now = new Date();
  let attempt = await prisma.attempt.findFirst({ where: { userId: user!.id, mockTestId: mockTest.id, status: 'IN_PROGRESS' }, include: { responses: true } });
  const baseStart = attempt?.startTime ?? now;
  const baseDeadline = new Date(baseStart.getTime() + (mockTest.totalDuration * 1000));
  const sectionDeadlines = mockTest.timerType === 'SECTIONAL' ? mockTest.sections.reduce((st: any, s: any) => { st.cursor += s.duration * 1000; st.acc.push(new Date(baseStart.getTime() + st.cursor).toISOString()); return st; }, { acc: [], cursor: 0 }).acc : null;
  if (!attempt) { attempt = await prisma.attempt.create({ data: { userId: user!.id, mockTestId: mockTest.id, startTime: now, status: 'IN_PROGRESS', deadline: baseDeadline, sectionDeadlines: sectionDeadlines ?? undefined, currentSectionIdx: 0 }, include: { responses: true } }); }
  else if (!attempt.deadline) { attempt = await prisma.attempt.update({ where: { id: attempt.id }, data: { deadline: baseDeadline, sectionDeadlines: sectionDeadlines ?? undefined }, include: { responses: true } }); }
  const idx = attempt.currentSectionIdx ?? 0;
  const sd = (attempt.sectionDeadlines as string[] | null) ?? sectionDeadlines;
  const activeDeadline = mockTest.timerType === 'SECTIONAL' && sd?.[idx] ? sd[idx] : attempt.deadline!.toISOString();
  return NextResponse.json({
    attemptId: attempt.id, serverTime: now.toISOString(), timerType: mockTest.timerType, deadline: activeDeadline, currentSectionIdx: idx,
    sections: mockTest.sections.map((s, i) => ({ id: s.id, name: s.name, duration: s.duration, deadline: (sd?.[i] ?? attempt!.deadline!.toISOString()), questions: s.questions.map(stripAnswer) })),
    responses: Object.fromEntries(attempt.responses.map(r => [r.questionId, { selectedOption: r.selectedOption, status: r.status, timeSpent: r.timeSpent }])),
  });
}