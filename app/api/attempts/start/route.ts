import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

function stripAnswer(q: any) { const { correctOption, explanation, ...safe } = q; return safe; }

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || auth.role !== 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { testId, forceNew } = await req.json();
    if (!testId) return NextResponse.json({ error: 'testId required' }, { status: 400 });
    
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    const mockTest = await prisma.mockTest.findFirst({ where: { id: testId, batches: { some: { id: user?.batchId! } } }, include: { sections: { orderBy: { id: 'asc' }, include: { questions: { orderBy: { id: 'asc' } } } } } });
    if (!mockTest) return NextResponse.json({ error: 'Test not available' }, { status: 404 });
    
    const now = new Date();
    let attempt = null;
    if (!forceNew) { attempt = await prisma.attempt.findFirst({ where: { userId: user!.id, mockTestId: mockTest.id, status: 'IN_PROGRESS' }, include: { responses: true } }); }
    
    const baseStart = attempt?.startTime ?? now;
    const baseDeadline = new Date(baseStart.getTime() + (mockTest.totalDuration * 1000));
    const sectionDeadlines = mockTest.timerType === 'SECTIONAL' ? mockTest.sections.reduce((st: any, s: any) => { st.cursor += s.duration * 1000; st.acc.push(new Date(baseStart.getTime() + st.cursor).toISOString()); return st; }, { acc: [], cursor: 0 }).acc : null;
    
    if (!attempt) { 
      try {
        attempt = await prisma.attempt.create({ data: { userId: user!.id, mockTestId: mockTest.id, startTime: now, status: 'IN_PROGRESS', deadline: baseDeadline, sectionDeadlines: sectionDeadlines ?? undefined, currentSectionIdx: 0 }, include: { responses: true } }); 
      } catch (err: any) {
        // Catch double-click race condition (Unique constraint failed)
        if (err.code === 'P2002') {
          attempt = await prisma.attempt.findFirst({ where: { userId: user!.id, mockTestId: mockTest.id, status: 'IN_PROGRESS' }, include: { responses: true } });
        } else {
          throw err;
        }
      }
    } else {
      const patch: any = {};
      if (!attempt.deadline) patch.deadline = baseDeadline;
      if (mockTest.timerType === 'SECTIONAL' && !attempt.sectionDeadlines) patch.sectionDeadlines = sectionDeadlines;
      
      if (attempt.pausedAt) {
        const pausedMs = Math.max(0, now.getTime() - attempt.pausedAt.getTime());
        patch.pausedAt = null;
        patch.pausedDurationMs = attempt.pausedDurationMs + pausedMs;
        if (attempt.deadline) patch.deadline = new Date(attempt.deadline.getTime() + pausedMs);
      }

      if (Object.keys(patch).length > 0) {
        attempt = await prisma.attempt.update({ where: { id: attempt!.id }, data: patch, include: { responses: true } });
      }
    }

    const idx = attempt!.currentSectionIdx ?? 0;
    const sd = (attempt!.sectionDeadlines as string[] | null) ?? sectionDeadlines;
    const activeDeadline = mockTest.timerType === 'SECTIONAL' && sd?.[idx] ? sd[idx] : attempt!.deadline!.toISOString();
    
    return NextResponse.json({
      attemptId: attempt!.id, serverTime: now.toISOString(), timerType: mockTest.timerType, deadline: activeDeadline, currentSectionIdx: idx,
      sections: mockTest.sections.map((s, i) => ({ id: s.id, name: s.name, duration: s.duration, deadline: (sd?.[i] ?? attempt!.deadline!.toISOString()), questions: s.questions.map(stripAnswer) })),
      responses: Object.fromEntries(attempt!.responses.map(r => [r.questionId, { selectedOption: r.selectedOption, status: r.status, timeSpent: r.timeSpent }])),
    });
  } catch (error: any) {
    console.error("Start API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}