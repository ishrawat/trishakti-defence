export const instant = false;
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await getUserFromRequest(req);
  if (!auth || auth.role !== 'TEACHER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { imageUrl, linkUrl, title, subtitle, buttonText } = await req.json();

    if (!imageUrl || !linkUrl) {
      return NextResponse.json({ error: 'Image URL and Link URL are required' }, { status: 400 });
    }

    await prisma.banner.updateMany({ data: { isActive: false } });
    const newBanner = await prisma.banner.create({ 
      data: { imageUrl, linkUrl, title, subtitle, buttonText, isActive: true } 
    });

    return NextResponse.json(newBanner);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}