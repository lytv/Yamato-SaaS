/**
 * OutsourceOrder Filtered Locations API Route
 * Returns locations (work tables) filtered by product sub for dependency chain
 */

import { auth } from '@clerk/nextjs/server';
import { and, eq, isNotNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { planDetailSchema, planSchema, workTableSchema } from '@/models/Schema';

// GET /api/outsourceOrders/relations/locations?productSubCode=X
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Use orgId for organization-based multi-tenancy, fallback to userId
    const ownerId = orgId || userId;

    const { searchParams } = new URL(request.url);
    const productSubCode = searchParams.get('productSubCode');

    if (!productSubCode) {
      return NextResponse.json(
        { success: false, error: 'Product Sub Code is required', code: 'MISSING_PRODUCT_SUB_CODE' },
        { status: 400 },
      );
    }

    // Get work tables/locations filtered by product sub code
    // Join plan_detail with work_table to find locations that support the product sub
    const locations = await db
      .select({
        code: planDetailSchema.locationCode,
        name: workTableSchema.tableName,
        description: workTableSchema.tableCategory,
      })
      .from(planDetailSchema)
      .innerJoin(planSchema, eq(planDetailSchema.planId, planSchema.id))
      .innerJoin(workTableSchema, eq(planDetailSchema.locationCode, workTableSchema.tableCode))
      .where(and(
        eq(planSchema.ownerId, ownerId),
        eq(planDetailSchema.productSubCode, productSubCode),
        isNotNull(planDetailSchema.locationCode),
      ))
      .groupBy(
        planDetailSchema.locationCode,
        workTableSchema.tableName,
        workTableSchema.tableCategory,
      )
      .orderBy(planDetailSchema.locationCode);

    // Format response - filter out null location codes
    const validLocations = locations
      .filter((location: { code: string | null; name: string | null; description: string | null }) => location.code != null)
      .map((location: { code: string; name: string | null; description: string | null }) => ({
        code: location.code,
        name: location.name || `Location ${location.code}`,
        description: location.description,
      }));

    return NextResponse.json({
      success: true,
      data: validLocations,
    });
  } catch (error) {
    console.error('GET /api/outsourceOrders/relations/locations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
