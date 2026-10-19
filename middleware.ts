import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = bearer ?? req.cookies.get('auth_token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role as string;

    if (pathname.startsWith('/teacher') && role !== 'TEACHER') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if ((pathname.startsWith('/student') || pathname.startsWith('/exam')) && role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    return NextResponse.next();
  } catch {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/student/:path*', '/exam/:path*', '/teacher/:path*', '/api/attempts/:path*'],
};