import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth';


export async function POST(request: Request) {
  try {
    const { testId, forceNew } = await request.json();

    // Get the real logged-in user
    const userId = await getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (forceNew) {
      await prisma.attempt.updateMany({
        where: { userId, mockTestId: testId, status: 'IN_PROGRESS' },
        data: { status: 'ABANDONED' }
      });
    }

    let attempt = await prisma.attempt.findFirst({
      where: { userId, mockTestId: testId, status: 'IN_PROGRESS' },
      include: { responses: true }
    });

    if (!attempt) {
      attempt = await prisma.attempt.create({
        data: { userId, mockTestId: testId, status: 'IN_PROGRESS' },
        include: { responses: true }
      });
    }

    return NextResponse.json(attempt);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to start attempt' }, { status: 500 });
  }
}