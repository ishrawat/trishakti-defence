import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


// GET: Fetch all exams
export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      include: { mockTests: true }
    });
    return NextResponse.json(exams);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}

// POST: Create a new exam
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newExam = await prisma.exam.create({
      data: {
        name: body.name,
        description: body.description,
      },
    });
    return NextResponse.json(newExam, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
  }
}
