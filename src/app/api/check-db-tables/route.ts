/**
 * Check Database Tables for outsourceOrderDetails
 * NOTE: This is a debug endpoint - remove or restrict in production
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/db';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if table exists
    const result = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%outsource%'
    `);

    return NextResponse.json({
      success: true,
      tables: result.rows,
      message: 'Database check completed',
    });
  } catch (error) {
    console.error('🚨 Database check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
