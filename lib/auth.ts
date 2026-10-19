import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';
export async function authTokenFromRequest(_req?: NextRequest): Promise<string | undefined> {
  try { const h = await headers(); const bearer = h.get('authorization')?.replace(/^Bearer\s+/i, ''); if (bearer) return bearer; } catch {}
  const b2 = _req?.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (b2) return b2;
  try { return (await cookies()).get('auth_token')?.value; } catch { return undefined; }
}
export async function getUserFromRequest(_req?: NextRequest) {
  const token = await authTokenFromRequest(_req);
  if (!token) return null;
  try {
    const { jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
    return payload as { userId: string; role: 'STUDENT' | 'TEACHER'; name: string };
  } catch { return null; }
}import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function getUserIdFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) return null;
  
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super_secret_exam_key_123');
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return null;
  }
}