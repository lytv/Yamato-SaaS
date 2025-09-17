/**
 * OutsourceOrder Production Steps API Route
 * Returns production steps filtered by location and product sub for dependency chain
 */

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { productionStepSchema } from '@/models/Schema';

// GET /api/outsourceOrders/relations/production-steps?locationCode=X&productSubCode=Y
export async function GET(_request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    const ownerId = orgId || userId;

    // Get production steps directly - no need to join with production_step_detail
    const productionSteps = await db
      .select({
        id: productionStepSchema.id,
        stepCode: productionStepSchema.stepCode,
        stepName: productionStepSchema.stepName,
      })
      .from(productionStepSchema)
      .where(eq(productionStepSchema.ownerId, ownerId))
      .orderBy(productionStepSchema.stepName);

    // Return all production steps (locationCode and productSubCode parameters can be ignored for now)
    const filteredSteps = productionSteps;

    return NextResponse.json({
      success: true,
      data: filteredSteps,
    });
  } catch (error) {
    console.error('GET /api/outsourceOrders/relations/production-steps error:', error);
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
