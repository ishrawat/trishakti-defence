export const instant = false;
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function PUT(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await params;
    const body = await request.json();
    const testIds = Array.isArray(body.testIds) ? body.testIds : [];

    const updated = await prisma.batch.update({
      where: { id: batchId },
      data: {
        mockTests: { set: testIds.map((id: string) => ({ id })) }
      }
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error("❌ Batch PUT Error:", error.message);
    return NextResponse.json({ error: 'Failed to update batch access', details: error.message }, { status: 500 });
  }
}