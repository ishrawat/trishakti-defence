export const instant = false;
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const { sectionId, questions } = await request.json();

    if (!sectionId || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Missing sectionId or questions' }, { status: 400 });
    }

    // Format the data for Prisma createMany
    const dataToInsert = questions.map((q: any) => ({
      sectionId,
      text: q.text,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      explanation: q.explanation || null,
      topic: q.topic || null,
      positiveMarks: q.positiveMarks || 1.0,
      negativeMarks: q.negativeMarks || -0.25,
    }));

    // Use createMany for bulk insertion (very fast)
    const result = await prisma.question.createMany({
      data: dataToInsert,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error("Bulk Upload Error:", error);
    return NextResponse.json({ error: 'Failed to upload questions', details: error.message }, { status: 500 });
  }
}