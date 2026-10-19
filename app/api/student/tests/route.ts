import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!user.batchId) return NextResponse.json([]);

    const tests = await prisma.mockTest.findMany({
      where: { batches: { some: { id: user.batchId } } },
      include: { exam: true }
    });

    return NextResponse.json(tests);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}