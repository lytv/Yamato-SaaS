/**
 * Test Organization-based Filtering for OutsourceOrderDetails
 * NOTE: This is a debug endpoint - remove or restrict in production
 */
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/db';
import { outsourceOrderDetailSchema, planSchema } from '@/models/Schema';

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use orgId for organization-based multi-tenancy, fallback to userId
    const ownerId = orgId || userId;

    // Test 1: Plans with old filter (userId only)
    const plansWithUserId = await db
      .select({
        id: planSchema.id,
        planCode: planSchema.planCode,
        planName: planSchema.planName,
        ownerId: planSchema.ownerId,
      })
      .from(planSchema)
      .where(eq(planSchema.ownerId, userId))
      .limit(5);

    // Test 2: Plans with new filter (orgId || userId)
    const plansWithOrgFilter = await db
      .select({
        id: planSchema.id,
        planCode: planSchema.planCode,
        planName: planSchema.planName,
        ownerId: planSchema.ownerId,
      })
      .from(planSchema)
      .where(eq(planSchema.ownerId, ownerId))
      .limit(5);

    // Test 3: OutsourceOrderDetails with new filter
    const orderDetailsWithOrgFilter = await db
      .select({
        id: outsourceOrderDetailSchema.id,
        planCode: outsourceOrderDetailSchema.planCode,
        planName: outsourceOrderDetailSchema.planName,
        ownerId: outsourceOrderDetailSchema.ownerId,
      })
      .from(outsourceOrderDetailSchema)
      .where(eq(outsourceOrderDetailSchema.ownerId, ownerId))
      .limit(5);

    const result = {
      success: true,
      debug: {
        auth: { userId, orgId, ownerId },
        filtering: {
          plans_with_userId_only: {
            count: plansWithUserId.length,
            data: plansWithUserId,
          },
          plans_with_org_filter: {
            count: plansWithOrgFilter.length,
            data: plansWithOrgFilter,
          },
          order_details_with_org_filter: {
            count: orderDetailsWithOrgFilter.length,
            data: orderDetailsWithOrgFilter,
          },
        },
        comparison: {
          filter_difference: plansWithOrgFilter.length - plansWithUserId.length,
          using_org_filter: !!orgId,
          effective_owner: ownerId,
        },
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('🚨 Organization Filter Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
