export const instant = false;
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        users: { include: { attempts: { where: { status: 'COMPLETED' } } } },
        mockTests: { select: { id: true } }
      }
    });

    const formatted = batches.map((batch: any) => {
      let totalScore = 0;
      let totalAttempts = 0;
      
      batch.users.forEach((user: any) => {
        user.attempts.forEach((attempt: any) => {
          totalScore += attempt.totalScore;
          totalAttempts++;
        });
      });

      return {
        id: batch.id,
        name: batch.name,
        studentCount: batch.users.length,
        averageScore: totalAttempts > 0 ? (totalScore / totalAttempts).toFixed(2) : 'N/A',
        totalAttempts,
        testIds: batch.mockTests.map((t: any) => t.id) || [] 
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("❌ Batches API Error:", error.message);
    // If it fails, return an empty array so the frontend doesn't crash
    return NextResponse.json([], { status: 200 }); 
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const newBatch = await prisma.batch.create({ data: { name } });
    return NextResponse.json(newBatch);
  } catch (error) {
    return NextResponse.json({ error: 'Batch name might already exist' }, { status: 500 });
  }
}