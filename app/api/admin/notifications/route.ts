export const instant = false;
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, batchId } = body;
    
    // Ensure empty strings are treated as null for the database relation
    const finalBatchId = (batchId === "" || !batchId) ? null : batchId;

    const notification = await prisma.notification.create({
      data: { 
        title, 
        message, 
        batchId: finalBatchId 
      }
    });
    
    return NextResponse.json(notification);
  } catch (error: any) {
    console.error("❌ Admin Notification Error:", error.message);
    return NextResponse.json({ error: 'Failed to send', details: error.message }, { status: 500 });
  }
}