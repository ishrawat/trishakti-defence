export const instant = false;
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET(request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const { testId } = await params;
    const test = await prisma.mockTest.findUnique({
      where: { id: testId },
      include: { sections: { include: { questions: true } }, batches: true }
    });
    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const { testId } = await params;
    await prisma.mockTest.delete({ where: { id: testId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ testId: string }> }) {
  try {
    const { testId } = await params;
    const body = await request.json();

    const updated = await prisma.mockTest.update({
      where: { id: testId },
      data: { 
        title: body.title,
        totalDuration: body.totalDuration,
        timerType: body.timerType,
        overallCutoff: body.overallCutoff ? parseFloat(body.overallCutoff) : null,
        batches: { set: (body.batchIds || []).map((id: string) => ({ id })) }
      }
    });

    if (body.sections && body.sections.length > 0) {
      for (const sec of body.sections) {
        await prisma.section.update({
          where: { id: sec.id },
          data: { 
            name: sec.name,
            duration: sec.duration ? parseInt(sec.duration) : null,
            cutoffMarks: sec.cutoffMarks ? parseFloat(sec.cutoffMarks) : null
          }
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Update Test Error:", error.message);
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}