/**
 * OutsourceOrder Filtered Product Subs API Route
 * Returns product subs filtered by product for dependency chain
 */

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { productSubSchema } from '@/models/Schema';

// GET /api/outsourceOrders/relations/product-subs?productId=X
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
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required', code: 'MISSING_PRODUCT_ID' },
        { status: 400 },
      );
    }

    // Get product subs that belong to the selected product
    const productSubs = await db
      .select({
        code: productSubSchema.productSubCode,
        name: productSubSchema.productSubDetail,
      })
      .from(productSubSchema)
      .where(eq(productSubSchema.productId, Number(productId)));

    return NextResponse.json({
      success: true,
      data: productSubs,
    });
  } catch (error) {
    console.error('GET /api/outsourceOrders/relations/product-subs error:', error);
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
