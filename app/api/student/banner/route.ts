import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const banner = await prisma.banner.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(banner || null, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch banner' }, { status: 500 });
  }
}