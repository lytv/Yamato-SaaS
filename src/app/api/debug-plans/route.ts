/**
 * Debug API for Plans data
 * NOTE: This is a debug endpoint - remove or restrict in production
 */
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/db';
import { planSchema } from '@/models/Schema';

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use orgId for organization-based multi-tenancy, fallback to userId
    const ownerId = orgId || userId;

    // Test 1: Count all plans
    const allPlans = await db
      .select()
      .from(planSchema)
      .limit(10);

    // Test 2: Count user's plans (organization-based)
    const userPlans = await db
      .select({
        id: planSchema.id,
        planCode: planSchema.planCode,
        planName: planSchema.planName,
        ownerId: planSchema.ownerId,
        status: planSchema.status,
      })
      .from(planSchema)
      .where(eq(planSchema.ownerId, ownerId));

    // Test 3: Check recent plans (any owner)
    const recentPlans = await db
      .select({
        id: planSchema.id,
        planCode: planSchema.planCode,
        planName: planSchema.planName,
        ownerId: planSchema.ownerId,
        status: planSchema.status,
        createdAt: planSchema.createdAt,
      })
      .from(planSchema)
      .orderBy(planSchema.createdAt)
      .limit(5);

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        orgId,
        ownerId,
        totalPlansCount: allPlans.length,
        userPlansCount: userPlans.length,
        userPlans,
        recentPlans,
      },
    });
  } catch (error) {
    console.error('🚨 Debug Plans Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
