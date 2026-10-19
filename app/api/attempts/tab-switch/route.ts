import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const { attemptId } = await request.json();
    
    await prisma.attempt.update({
      where: { id: attemptId },
      data: { tabSwitchCount: { increment: 1 } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log tab switch' }, { status: 500 });
  }
}