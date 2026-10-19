export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';


export async function GET() {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, batch: { select: { name: true } }, initialPassword: true }
    });
    return NextResponse.json(students);
  } catch (error: any) {
    console.error("❌ GET Students Error:", error.message);
    return NextResponse.json({ error: 'Failed to fetch students', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, password, batchId } = await request.json();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'STUDENT', batchId: batchId || null, initialPassword: password }
    });

    return NextResponse.json({ success: true, userId: newUser.id });
  } catch (error: any) {
    console.error("❌ POST Student Error:", error.message);
    return NextResponse.json({ error: 'Failed to create student', details: error.message }, { status: 500 });
  }
}