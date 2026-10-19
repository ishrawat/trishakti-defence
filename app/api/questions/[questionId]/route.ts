import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function PUT(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const { questionId } = await params;
    const body = await request.json();

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        text: body.text,
        optionA: body.optionA,
        optionB: body.optionB,
        optionC: body.optionC,
        optionD: body.optionD,
        correctOption: body.correctOption,
        explanation: body.explanation || null,
        positiveMarks: parseFloat(body.positiveMarks) || 1.0,
        negativeMarks: parseFloat(body.negativeMarks) || -0.25,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const { questionId } = await params;
    await prisma.question.delete({ where: { id: questionId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}