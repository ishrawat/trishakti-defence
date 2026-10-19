import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth || auth.role !== 'TEACHER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, message, batchId } = await req.json();

  // 1. Save to Database
  const notif = await prisma.notification.create({
    data: { title, message, batchId: batchId || null }
  });

  // 2. Find target users with push tokens
  const users = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      ...(batchId ? { batchId } : {}),
      expoPushToken: { not: null }
    },
    select: { expoPushToken: true }
  });

  const tokens = users.map(u => u.expoPushToken).filter(t => t && Expo.isExpoPushToken(t)) as string[];

  // 3. Send Push Notifications
  if (tokens.length > 0) {
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: message,
      data: { notifId: notif.id },
    }));

    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try { await expo.sendPushNotificationsAsync(chunk); } catch (e) { console.error(e); }
    }
  }

  return NextResponse.json({ success: true, notif });
}