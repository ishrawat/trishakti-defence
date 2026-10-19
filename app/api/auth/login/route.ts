import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-trishul-key-2024');

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await new SignJWT({ userId: user.id, role: user.role, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);

  const res = NextResponse.json({
    success: true,
    role: user.role,
    token, // THIS IS THE CRITICAL FIX
    user: { id: user.id, name: user.name, role: user.role, batchId: user.batchId },
    debug_v3: "yes" // PROVES VERCEL IS RUNNING THE NEW CODE
  });

  res.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 604800,
  });

  return res;
}