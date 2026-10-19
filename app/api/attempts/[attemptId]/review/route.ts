import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { attemptId } = await params;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        mockTest: {
          include: { sections: { orderBy: { id: 'asc' }, include: { questions: { orderBy: { id: 'asc' } } } } }
        },
        responses: true
      }
    });

    if (!attempt || attempt.userId !== auth.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // 1. Calculate Rank, Percentile, Average, Best
    const allAttempts = await prisma.attempt.findMany({
      where: { mockTestId: attempt.mockTestId, status: 'COMPLETED' },
      select: { totalScore: true }
    });

    const totalAttempts = allAttempts.length || 1; // Prevent divide by zero
    const userScore = attempt.totalScore || 0;
    const betterScores = allAttempts.filter(a => (a.totalScore || 0) > userScore).length;
    const rank = betterScores + 1;
    const percentile = totalAttempts > 1 ? (((totalAttempts - rank) / (totalAttempts - 1)) * 100).toFixed(2) : 100.00;
    
    const averageScore = (allAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) / totalAttempts).toFixed(2);
    const bestScore = Math.max(...allAttempts.map(a => a.totalScore || 0));

    // 2. Calculate Crowd Stats per Question
    const allResponses = await prisma.response.findMany({
      where: { attempt: { mockTestId: attempt.mockTestId, status: 'COMPLETED' } }
    });

    const crowdStats: Record<string, { total: number, correct: number }> = {};
    attempt.mockTest.sections.forEach(sec => {
      sec.questions.forEach(q => {
        const qResponses = allResponses.filter(r => r.questionId === q.id);
        const correctCount = qResponses.filter(r => r.selectedOption === q.correctOption).length;
        crowdStats[q.id] = { total: qResponses.length, correct: correctCount };
      });
    });

    return NextResponse.json({
      attempt: { id: attempt.id, totalScore: attempt.totalScore, status: attempt.status },
      mockTest: attempt.mockTest,
      responses: attempt.responses,
      stats: { rank, totalAttempts, percentile, averageScore, bestScore, crowdStats }
    });

  } catch (error: any) {
    console.error("Review API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}