import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: auth.userId }, include: { batch: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const attempts = await prisma.attempt.findMany({ where: { userId: user.id, status: 'COMPLETED' } });
  const totalTests = attempts.length;
  const avgScore = totalTests > 0 ? (attempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) / totalTests).toFixed(1) : 0;
  
  // Very basic accuracy estimation (assuming 1 mark per correct, -0.25 per wrong, etc.)
  // For exact accuracy we'd need to count responses, but this is a good proxy.
  let totalAttempted = 0;
  let totalCorrect = 0;
  const responses = await prisma.response.findMany({ where: { attempt: { userId: user.id } }, include: { question: true } });
  responses.forEach(r => {
    if (r.selectedOption) {
      totalAttempted++;
      if (r.selectedOption === r.question.correctOption) totalCorrect++;
    }
  });
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  return NextResponse.json({
    name: user.name,
    email: user.email,
    batch: user.batch?.name ?? null,
    stats: { totalTests, avgScore, accuracy }
  });
}