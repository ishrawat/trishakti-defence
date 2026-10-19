export const instant = false;
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newMockTest = await prisma.mockTest.create({
      data: {
        examId: body.examId,
        title: body.title,
        timerType: body.timerType,
        totalDuration: body.totalDuration,
        overallCutoff: body.overallCutoff ? parseFloat(body.overallCutoff) : null,
        batches: { connect: (body.batchIds || []).map((id: string) => ({ id })) },
        sections: {
          create: body.sections.map((sec: any) => ({
            name: sec.name,
            duration: sec.duration ? parseInt(sec.duration) : null,
            cutoffMarks: sec.cutoffMarks ? parseFloat(sec.cutoffMarks) : null,
          }))
        }
      },
      include: { sections: true }
    });

    return NextResponse.json(newMockTest, { status: 201 });
  } catch (error: any) {
    console.error("Create Test Error:", error.message);
    return NextResponse.json({ error: 'Failed to create mock test' }, { status: 500 });
  }
}