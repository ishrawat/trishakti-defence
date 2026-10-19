import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: auth.userId }, include: { batch: true } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 1. Tests
    const tests = user.batchId ? await prisma.mockTest.findMany({
      where: { batches: { some: { id: user.batchId } } },
      include: { exam: true, attempts: { where: { userId: user.id, status: 'IN_PROGRESS' }, select: { id: true } } }
    }) : [];

    // 2. Banner
    const banner = await prisma.banner.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });

    // 3. Notifications
    const notifications = await prisma.notification.findMany({
      where: { OR: [{ batchId: null }, { batchId: user.batchId }] },
      include: { reads: { where: { userId: user.id } } },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Profile Data
    const profile = { name: user.name, email: user.email, batch: user.batch?.name ?? null };

    return NextResponse.json({
      tests,
      banner,
      profile,
      notifications: notifications.map(n => ({ ...n, isRead: n.reads.length > 0 })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}