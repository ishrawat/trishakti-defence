import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const token = await new SignJWT({ userId: user.id, role: user.role, name: user.name }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(SECRET);
  const res = NextResponse.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role, batchId: user.batchId } });
  res.cookies.set('auth_token', token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 604800 });
  return res;
}