export const instant = false;
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    // FIX: Include questions INSIDE sections
    const mockTests = await prisma.mockTest.findMany({
      include: { 
        exam: true,
        sections: {
          include: {
            questions: true 
          }
        } 
      }
    });
    return NextResponse.json(mockTests);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newQuestion = await prisma.question.create({
      data: {
        sectionId: body.sectionId,
        text: body.text,
        optionA: body.optionA,
        optionB: body.optionB,
        optionC: body.optionC,
        optionD: body.optionD,
        correctOption: body.correctOption,
        explanation: body.explanation || null,
        topic: body.topic || null,
        positiveMarks: parseFloat(body.positiveMarks) || 1.0,
        negativeMarks: parseFloat(body.negativeMarks) || -0.25,
      },
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error: any) {
    console.error("❌ PRISMA ERROR:", error.message);
    return NextResponse.json({ error: 'Failed to create question', details: error.message }, { status: 500 });
  }
}