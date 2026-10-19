export const instant = false;
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // We now need the testId to find all the sections inside it
    const { testId, defaultSectionId, questions } = await request.json();

    if (!testId || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Missing testId or questions' }, { status: 400 });
    }

    // 1. Fetch the test and all its sections
    const test = await prisma.mockTest.findUnique({
      where: { id: testId },
      include: { sections: true }
    });

    if (!test) {
      return NextResponse.json({ error: 'Mock test not found' }, { status: 404 });
    }

    // 2. Map the data and assign the correct Section ID
    const dataToInsert = questions.map((q: any, index: number) => {
      // If the Excel has a Section column, find that section's ID
      let finalSectionId = defaultSectionId;
      
      if (q.sectionName) {
        const matchedSection = test.sections.find(
          (s) => s.name.toLowerCase() === String(q.sectionName).toLowerCase().trim()
        );
        if (matchedSection) {
          finalSectionId = matchedSection.id;
        } else {
          throw new Error(`Row ${index + 2}: Section "${q.sectionName}" not found in this test.`);
        }
      }

      if (!finalSectionId) {
        throw new Error(`Row ${index + 2}: No section selected or found.`);
      }

      // Clean the data (String() fixes the Excel Date issue)
      return {
        sectionId: finalSectionId,
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
      };
    });

    // 3. Insert them all
    const result = await prisma.question.createMany({
      data: dataToInsert,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error("Bulk Upload Error:", error.message);
    return NextResponse.json({ error: error.message || 'Failed to upload questions' }, { status: 500 });
  }
}