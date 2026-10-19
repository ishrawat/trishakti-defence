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
          { batchId: user?.batchId || undefined },
          { batchId: null }
        ]
      },
      include: {
        reads: { where: { userId } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const formatted = notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      isRead: n.reads.length > 0
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("❌ Student Notification Fetch Error:", error.message);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { notificationIds } = await request.json();
    
    // Create read receipts for each notification
    const data = notificationIds.map((id: string) => ({
      userId,
      notificationId: id
    }));

    await prisma.notificationRead.createMany({
      data,
      skipDuplicates: true // Ignore if already read
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Student Notification PUT Error:", error.message);
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
  }
}