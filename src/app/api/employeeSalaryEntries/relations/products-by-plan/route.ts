/**
 * API Route to get products filtered by plan
 * Used for filtering product selection based on selected plan
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { productSchema, planDetailSchema, planSchema } from '@/models/Schema';

// GET /api/employeeSalaryEntries/relations/products-by-plan?planId=X
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
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

    console.log(`🔍 [products-by-plan] planId: ${planId}, ownerId: ${orgId || userId}`);
    
    // First, let's check if planDetail exists for this plan (through plan's orgId)
    const planDetailCount = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(planDetailSchema)
      .innerJoin(planSchema, eq(planDetailSchema.planId, planSchema.id))
      .where(
        and(
          eq(planDetailSchema.planId, Number(planId)),
          eq(planSchema.ownerId, orgId || userId)
        )
      );
    
    console.log(`📊 [products-by-plan] PlanDetail records found: ${planDetailCount[0]?.count || 0}`);
    
    // Query products that are associated with the selected plan through plan_detail
    // Filter by plan's orgId (organization-wide access)
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
      .innerJoin(planSchema, eq(planDetailSchema.planId, planSchema.id))
      .where(
        and(
          eq(planDetailSchema.planId, Number(planId)),
          eq(planSchema.ownerId, orgId || userId),
          eq(productSchema.ownerId, orgId || userId)
        )
      )
      .orderBy(productSchema.productName);

    console.log(`✅ [products-by-plan] Found ${productsInPlan.length} products:`, productsInPlan);

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