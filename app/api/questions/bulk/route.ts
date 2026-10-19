export const instant = false;
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { sectionId, questions } = await request.json();

    if (!sectionId || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Missing sectionId or questions' }, { status: 400 });
    }

    // Format the data safely (force everything to be a string, just in case Excel messed it up)
    const dataToInsert = questions.map((q: any) => ({
      sectionId,
      text: String(q.text || '').trim(),
      optionA: String(q.optionA || '').trim(),
      optionB: String(q.optionB || '').trim(),
      optionC: String(q.optionC || '').trim(),
      optionD: String(q.optionD || '').trim(),
      correctOption: String(q.correctOption || 'A').trim().toUpperCase(),
      explanation: String(q.explanation || '').trim(),
      topic: String(q.topic || '').trim(),
      positiveMarks: parseFloat(q.positiveMarks) || 1.0,
      negativeMarks: parseFloat(q.negativeMarks) || -0.25,
    }));

    const result = await prisma.question.createMany({
      data: dataToInsert,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error("Bulk Upload Error:", error.message);
    return NextResponse.json({ error: 'Failed to upload questions', details: error.message }, { status: 500 });
  }
}