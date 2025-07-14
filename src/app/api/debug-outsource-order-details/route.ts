/**
 * Debug API for outsourceOrderDetails - Simple test without joins
 * NOTE: This is a debug endpoint - remove or restrict in production
 */
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/db';
import { outsourceOrderDetailSchema } from '@/models/Schema';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test 1: Simple count query
    const countResult = await db
      .select()
      .from(outsourceOrderDetailSchema)
      .limit(1);

    // Test 2: Query with userId filter
    const userRecords = await db
      .select()
      .from(outsourceOrderDetailSchema)
      .where(eq(outsourceOrderDetailSchema.ownerId, userId))
      .limit(5);

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        totalRecords: countResult.length,
        userRecords: userRecords.length,
        sampleData: userRecords,
      },
    });
  } catch (error) {
    console.error('🚨 Debug API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
