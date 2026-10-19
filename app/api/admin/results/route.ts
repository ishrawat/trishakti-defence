import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const attempts = await prisma.attempt.findMany({
      include: {
        user: { select: { name: true, email: true } },
        mockTest: {
          include: { exam: { select: { name: true } } }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    const formatted = attempts.map(a => ({
      id: a.id,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      totalScore: a.totalScore,
      tabSwitchCount: a.tabSwitchCount,
      pauseCount: a.pauseCount,
      userId: a.userId,
      user: a.user,
      mockTest: a.mockTest
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("❌ Admin Results API Error:", error.message);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}