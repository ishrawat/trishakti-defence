export const instant = false;
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';


// GET: Fetch Single Student Profile
export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        attempts: {
          where: { status: 'COMPLETED' },
          include: { mockTest: true, responses: true },
          orderBy: { endTime: 'desc' }
        }
      }
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let totalTabSwitches = 0;
    let totalTimeSpent = 0;

    user.attempts.forEach(attempt => {
      totalTabSwitches += attempt.tabSwitchCount;
      attempt.responses.forEach(r => { totalTimeSpent += r.timeSpent; });
    });

    const averageScore = user.attempts.length > 0 
      ? user.attempts.reduce((acc, curr) => acc + curr.totalScore, 0) / user.attempts.length 
      : 0;

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, batchId: user.batchId, initialPassword: user.initialPassword },
      stats: { totalTests: user.attempts.length, averageScore: averageScore.toFixed(2), totalTimeSpent, totalTabSwitches },
      history: user.attempts
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT: Update Student Details (Name, Email, Batch, Password)
export async function PUT(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const { name, email, batchId, newPassword } = await request.json();

    const dataToUpdate: any = {
      name,
      email,
      batchId: batchId || null, // Handle empty selection
    };

    // Only update password if a new one was provided
    if (newPassword) {
      dataToUpdate.password = await bcrypt.hash(newPassword, 10);
      dataToUpdate.initialPassword = newPassword;
    }

    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: 'Failed to update student (Email might be in use)' }, { status: 500 });
  }
}