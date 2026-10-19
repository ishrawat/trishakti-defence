import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

// This tells Next.js 16 to skip static prerendering for this route
export const instant = false; 

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super_secret_exam_key_123');
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.role === 'TEACHER') {
      redirect('/teacher');
    } else {
      redirect('/student');
    }
  } catch (error) {
    redirect('/login');
  }
}