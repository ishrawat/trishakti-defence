export const instant = false;
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Clear the cookie
  response.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
  return response;
}