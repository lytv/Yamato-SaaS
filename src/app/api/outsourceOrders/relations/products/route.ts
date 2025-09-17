/**
 * OutsourceOrder Filtered Products API Route
 * Returns products filtered by plan for dependency chain
 */

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { planDetailSchema, productSchema } from '@/models/Schema';

// GET /api/outsourceOrders/relations/products?planId=X
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required', code: 'MISSING_PLAN_ID' },
        { status: 400 },
      );
    }

    // Get products that are associated with the selected plan through plan details
    const products = await db
      .select({
        id: productSchema.id,
        productCode: productSchema.productCode,
        productName: productSchema.productName,
      })
      .from(productSchema)
      .innerJoin(planDetailSchema, eq(planDetailSchema.productCode, productSchema.productCode))
      .where(eq(planDetailSchema.planId, Number(planId)));

    // Remove duplicates (in case a product appears in multiple plan details)
    const uniqueProducts = products.filter(
      (product: { id: number; productCode: string; productName: string }, index: number, self: typeof products) =>
        index === self.findIndex((p: { id: number; productCode: string; productName: string }) => p.id === product.id),
    );

    return NextResponse.json({
      success: true,
      data: uniqueProducts,
    });
  } catch (error) {
    console.error('GET /api/outsourceOrders/relations/products error:', error);
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
