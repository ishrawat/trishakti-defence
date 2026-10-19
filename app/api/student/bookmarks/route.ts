import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const bookmarks = await prisma.bookmark.findMany({ where: { userId: auth.userId }, include: { question: true } });
  return NextResponse.json(bookmarks);
}

export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { questionId } = await req.json();
  
  const existing = await prisma.bookmark.findUnique({ where: { userId_questionId: { userId: auth.userId, questionId } } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  } else {
    await prisma.bookmark.create({ data: { userId: auth.userId, questionId } });
    return NextResponse.json({ bookmarked: true });
  }
}