/**
 * OutsourceOrderDetail Relations Options API Route
 * Provides dropdown data for forms
 * Generated based on existing pattern from outsourceOrders/relations/options/route.ts
 */

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  outsourceOrderSchema,
  planSchema,
  productionStepSchema,
  productSchema,
} from '@/models/Schema';

// GET /api/outsourceOrderDetails/relations/options
export async function GET(_request: NextRequest) {
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

    // const { searchParams } = new URL(request.url);
    // const outsourceOrderId = searchParams.get('outsourceOrderId')
    //   ? Number(searchParams.get('outsourceOrderId'))
    //   : undefined;

    // Get outsource orders
    const outsourceOrders = await db
      .select({
        id: outsourceOrderSchema.id,
        orderCode: outsourceOrderSchema.orderCode,
        orderTitle: outsourceOrderSchema.orderTitle,
      })
      .from(outsourceOrderSchema)
      .where(eq(outsourceOrderSchema.ownerId, ownerId))
      .orderBy(outsourceOrderSchema.orderCode);

    // Get plans (filter by organization)
    const plans = await db
      .select({
        id: planSchema.id,
        planCode: planSchema.planCode,
        planName: planSchema.planName,
      })
      .from(planSchema)
      .where(eq(planSchema.ownerId, ownerId))
      .orderBy(planSchema.planCode);

    // Get products
    const products = await db
      .select({
        id: productSchema.id,
        productCode: productSchema.productCode,
        productName: productSchema.productName,
      })
      .from(productSchema)
      .where(eq(productSchema.ownerId, ownerId))
      .orderBy(productSchema.productCode);

    // Get production steps
    const productionSteps = await db
      .select({
        id: productionStepSchema.id,
        stepCode: productionStepSchema.stepCode,
        stepName: productionStepSchema.stepName,
      })
      .from(productionStepSchema)
      .where(eq(productionStepSchema.ownerId, ownerId))
      .orderBy(productionStepSchema.stepCode);

    const relationOptions = {
      outsourceOrders,
      plans,
      products,
      productionSteps,
    };

    return NextResponse.json({
      success: true,
      data: relationOptions,
    });
  } catch (error) {
    console.error('GET /api/outsourceOrderDetails/relations/options error:', error);
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
