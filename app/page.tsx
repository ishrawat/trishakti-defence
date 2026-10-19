import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // If no token, immediately send to login
  if (!token) {
    redirect('/login');
  }

  try {
    // Decode the token to see if they are a student or teacher
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super_secret_exam_key_123');
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.role === 'TEACHER') {
      redirect('/teacher');
    } else {
      redirect('/student');
    }
  } catch (error) {
    // If the token is invalid/expired, send to login
    redirect('/login');
  }
}