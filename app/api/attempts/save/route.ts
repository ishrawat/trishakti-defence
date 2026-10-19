import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const { attemptId, questionId, selectedOption, status, timeSpent } = await request.json();

    const existing = await prisma.response.findFirst({
      where: { attemptId, questionId }
    });

    if (existing) {
      await prisma.response.update({
        where: { id: existing.id },
        data: { 
          selectedOption, 
          status, 
          timeSpent: { increment: timeSpent || 0 } 
        }
      });
    } else {
      await prisma.response.create({
        data: { attemptId, questionId, selectedOption, status, timeSpent: timeSpent || 0 }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}