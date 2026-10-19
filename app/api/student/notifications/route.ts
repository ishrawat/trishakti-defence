import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { batchId: null },
          { batchId: user.batchId }
        ]
      },
      include: { reads: { where: { userId: user.id } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(notifications.map(n => ({ ...n, isRead: n.reads.length > 0 })));
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { notificationIds } = await req.json();
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await prisma.notificationRead.createMany({
      data: notificationIds.map(id => ({ userId, notificationId: id })),
      skipDuplicates: true
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to mark notifications' }, { status: 500 });
  }
}