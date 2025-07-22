/**
 * API Route to get products filtered by plan
 * Used for filtering product selection based on selected plan
 */

import { currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { productSchema, planDetailSchema } from '@/models/Schema';

// GET /api/employeeSalaryEntries/relations/products-by-plan?planId=X
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      );
    }

    // Query products that are associated with the selected plan through plan_detail
    const productsInPlan = await db
      .selectDistinct({
        id: productSchema.id,
        productCode: productSchema.productCode,
        productName: productSchema.productName,
      })
      .from(productSchema)
      .innerJoin(
        planDetailSchema,
        eq(productSchema.productCode, planDetailSchema.productCode)
      )
      .where(
        and(
          eq(planDetailSchema.planId, Number(planId)),
          eq(planDetailSchema.ownerId, user.id)
        )
      )
      .orderBy(productSchema.productName);

    return NextResponse.json({
      success: true,
      data: productsInPlan,
      metadata: {
        planId: Number(planId),
        totalProducts: productsInPlan.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching products by plan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products for plan',
        data: [] 
      },
      { status: 500 }
    );
  }
}