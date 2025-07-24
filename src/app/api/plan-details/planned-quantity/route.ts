/**
 * API Route to get planned quantity for a specific plan and product combination
 * Used for automatic planned quantity update in employee salary entries
 */

import { currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { planDetailSchema, productSchema } from '@/models/Schema';

// GET /api/plan-details/planned-quantity?planId=X&productId=Y
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const productId = searchParams.get('productId');

    if (!planId || !productId) {
      return NextResponse.json(
        { error: 'Both planId and productId are required' },
        { status: 400 }
      );
    }

    // First get the product code from the product table
    const productData = await db
      .select({
        productCode: productSchema.productCode,
      })
      .from(productSchema)
      .where(eq(productSchema.id, Number(productId)))
      .limit(1);

    if (!productData || productData.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `No product found with ID ${productId}`,
          data: null
        }, 
        { status: 404 }
      );
    }

    const productCode = productData[0].productCode;

    // Now query the plan_detail table for the planned quantity
    const plannedQuantityData = await db
      .select({
        id: planDetailSchema.id,
        planId: planDetailSchema.planId,
        productCode: planDetailSchema.productCode,
        plannedQuantity: planDetailSchema.plannedQuantity,
        actualQuantity: planDetailSchema.actualQuantity,
        locationCode: planDetailSchema.locationCode,
        status: planDetailSchema.status,
      })
      .from(planDetailSchema)
      .where(
        and(
          eq(planDetailSchema.planId, Number(planId)),
          eq(planDetailSchema.productCode, productCode)
        )
      );

    if (!plannedQuantityData || plannedQuantityData.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `No plan detail found for plan ${planId} and product ${productCode}`,
          data: null
        }, 
        { status: 404 }
      );
    }

    // Calculate total planned quantity if there are multiple locations
    const totalPlannedQuantity = plannedQuantityData.reduce((sum: number, item: any) => 
      sum + (item.plannedQuantity || 0), 0
    );

    const totalActualQuantity = plannedQuantityData.reduce((sum: number, item: any) => 
      sum + (item.actualQuantity || 0), 0
    );

    return NextResponse.json({
      success: true,
      data: {
        planId: Number(planId),
        productId: Number(productId),
        productCode,
        totalPlannedQuantity,
        totalActualQuantity,
        remainingQuantity: totalPlannedQuantity - totalActualQuantity,
        details: plannedQuantityData,
      },
      metadata: {
        planId: Number(planId),
        productId: Number(productId),
        locationsCount: plannedQuantityData.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching plan detail planned quantity:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch planned quantity',
        data: null 
      },
      { status: 500 }
    );
  }
}