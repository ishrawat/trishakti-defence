export const instant = false;
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params;
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        user: { select: { name: true, email: true } },
        mockTest: { include: { sections: { include: { questions: true } } } },
        responses: true
      }
    });
    return NextResponse.json(attempt);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}