import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params;
    
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        mockTest: {
          include: {
            exam: true,
            sections: {
              include: { questions: true }
            }
          }
        },
        responses: true
      }
    });

    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

    return NextResponse.json(attempt);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch review data' }, { status: 500 });
  }
}