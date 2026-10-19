import { cookies, headers } from 'next/headers';
import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-trishul-key-2024');

export async function authTokenFromRequest(_req?: NextRequest): Promise<string | undefined> {
  // 1. Try the request object passed directly (API Routes)
  const b2 = _req?.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (b2) return b2;

  // 2. Try headers() (Server Components / fallback)
  try {
    const h = await headers();
    const bearer = h.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (bearer) return bearer;
  } catch {}

  // 3. Try cookies (Web App)
  try {
    return (await cookies()).get('auth_token')?.value;
  } catch {
    return undefined;
  }
}

export async function getUserFromRequest(_req?: NextRequest) {
  const token = await authTokenFromRequest(_req);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; role: 'STUDENT' | 'TEACHER'; name: string };
  } catch {
    return null;
  }
}

export async function getUserIdFromToken(_req?: NextRequest) {
  const token = await authTokenFromRequest(_req);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}