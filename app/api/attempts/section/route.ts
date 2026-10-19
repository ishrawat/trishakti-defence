import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth || auth.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await req.json();
    if (!attemptId) return NextResponse.json({ error: 'attemptId required' }, { status: 400 });

    const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.userId !== auth.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Attempt not active' }, { status: 409 });
    }

    const mockTest = await prisma.mockTest.findUnique({
      where: { id: attempt.mockTestId },
      include: { sections: { orderBy: { id: 'asc' } } }
    });

    if (!mockTest) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    const nextIdx = (attempt.currentSectionIdx ?? 0) + 1;

    // If this was the last section, tell the client to submit the whole test
    if (nextIdx >= mockTest.sections.length) {
      return NextResponse.json({ submitted: true });
    }

    // Safely parse the new deadline for the next section
    let newDeadline = attempt.deadline;
    if (attempt.sectionDeadlines && Array.isArray(attempt.sectionDeadlines)) {
      const sd = attempt.sectionDeadlines as string[];
      if (sd[nextIdx]) {
        newDeadline = new Date(sd[nextIdx]);
      }
    }

    await prisma.attempt.update({
      where: { id: attempt.id },
      data: { currentSectionIdx: nextIdx, deadline: newDeadline }
    });

    return NextResponse.json({
      currentSectionIdx: nextIdx,
      deadline: newDeadline ? newDeadline.toISOString() : null,
      serverTime: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Section API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}