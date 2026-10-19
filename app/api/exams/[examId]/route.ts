import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function DELETE(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  try {
    const { examId } = await params;
    await prisma.exam.delete({ where: { id: examId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  try {
    const { examId } = await params;
    const body = await request.json();
    const updated = await prisma.exam.update({
      where: { id: examId },
      data: { name: body.name, description: body.description }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 });
  }
}