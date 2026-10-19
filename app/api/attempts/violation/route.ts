export const instant = false;
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';



export async function POST(request: Request) {
  try {
    const { attemptId, type } = await request.json();
    
    const updated = await prisma.attempt.update({
      where: { id: attemptId },
      data: { tabSwitchCount: { increment: 1 } }
    });

    console.log(`[VIOLATION LOGGED] Attempt: ${attemptId}, Type: ${type}, New Count: ${updated.tabSwitchCount}`);
    return NextResponse.json({ success: true, newCount: updated.tabSwitchCount });
  } catch (error: any) {
    console.error("Violation API Error:", error.message);
    return NextResponse.json({ error: 'Failed to log violation', details: error.message }, { status: 500 });
  }
}