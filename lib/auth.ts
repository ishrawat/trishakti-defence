import { cookies, headers } from 'next/headers';
import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function authTokenFromRequest(_req?: NextRequest): Promise<string | undefined> {
  try {
    const h = await headers();
    const bearer = h.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (bearer) return bearer;
  } catch {}

  const b2 = _req?.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (b2) return b2;

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

// Keep your original function just in case anything else uses it
export async function getUserIdFromToken() {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}