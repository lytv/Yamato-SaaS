/**
 * API Route to get quantity limit for a specific product and production step combination
 * Used for automatic limit quantity update in employee salary entries
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { productionStepDetailSchema } from '@/models/Schema';

// GET /api/production-step-details/quantity-limit?productionStepDetailId=X
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productionStepDetailId = searchParams.get('productionStepDetailId');

    if (!productionStepDetailId) {
      return NextResponse.json(
        { error: 'productionStepDetailId is required' },
        { status: 400 }
      );
    }

    // Query the production_step_detail table directly by ID
    const quantityLimitData = await db
      .select({
        id: productionStepDetailSchema.id,
        quantityLimit1: productionStepDetailSchema.quantityLimit1,
        quantityLimit2: productionStepDetailSchema.quantityLimit2,
        productId: productionStepDetailSchema.productId,
        productionStepId: productionStepDetailSchema.productionStepId,
      })
      .from(productionStepDetailSchema)
      .where(eq(productionStepDetailSchema.id, Number(productionStepDetailId)))
      .limit(1);

    if (!quantityLimitData || quantityLimitData.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `No production step detail found with ID ${productionStepDetailId}`,
          data: null
        }, 
        { status: 404 }
      );
    }

    const result = quantityLimitData[0];

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        productId: result.productId,
        productionStepId: result.productionStepId,
        quantityLimit1: result.quantityLimit1,
        quantityLimit2: result.quantityLimit2,
        // Provide the effective limit (quantityLimit1 takes precedence)
        effectiveLimit: result.quantityLimit1 || result.quantityLimit2 || null,
      },
      metadata: {
        productionStepDetailId: Number(productionStepDetailId),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching production step detail quantity limit:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch quantity limit',
        data: null 
      },
      { status: 500 }
    );
  }
}