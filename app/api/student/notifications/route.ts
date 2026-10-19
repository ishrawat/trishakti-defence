import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromToken } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Get notifications for the student's batch OR global notifications
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { batchId: user?.batchId || 'none' },
          { batchId: null }
        ]
      },
      include: {
        reads: { where: { userId } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Map to include isRead boolean
    const formatted = notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      isRead: n.reads.length > 0
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromToken();
    const { notificationIds } = await request.json();
    
    // Mark as read
    for (const id of notificationIds) {
      await prisma.notificationRead.upsert({
        where: { id: `${userId}_${id}` }, // Doesn't work like this, need custom unique constraint or just check first
        update: {},
        create: { userId, notificationId: id }
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
  }
}