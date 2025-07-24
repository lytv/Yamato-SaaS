/**
 * API Route to get previous entered quantity for a specific plan, product, and production step combination
 * Used for automatic previous quantity update in employee salary entries
 */

import { currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { eq, and, sum, ne } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { employeeSalaryEntrySchema } from '@/models/Schema';

// GET /api/employee-salary-entries/previous-quantity?planId=X&productId=Y&productionStepDetailId=Z&excludeId=W
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const productId = searchParams.get('productId');
    const productionStepDetailId = searchParams.get('productionStepDetailId');
    const excludeId = searchParams.get('excludeId'); // Optional: exclude current record when editing

    if (!planId || !productId || !productionStepDetailId) {
      return NextResponse.json(
        { error: 'planId, productId, and productionStepDetailId are required' },
        { status: 400 }
      );
    }

    // Build where conditions
    const conditions = [
      eq(employeeSalaryEntrySchema.plan_id, Number(planId)),
      eq(employeeSalaryEntrySchema.product_id, Number(productId)),
      eq(employeeSalaryEntrySchema.production_step_detail_id, Number(productionStepDetailId)),
    ];

    // Exclude current record if editing (to avoid counting itself)
    if (excludeId) {
      conditions.push(ne(employeeSalaryEntrySchema.id, Number(excludeId)));
    }

    // Query to sum all actual quantities for the same plan + product + production step detail
    const result = await db
      .select({
        totalPreviousQuantity: sum(employeeSalaryEntrySchema.actual_quantity),
      })
      .from(employeeSalaryEntrySchema)
      .where(and(...conditions));

    const totalPreviousQuantity = result[0]?.totalPreviousQuantity || 0;

    return NextResponse.json({
      success: true,
      data: {
        planId: Number(planId),
        productId: Number(productId),
        productionStepDetailId: Number(productionStepDetailId),
        totalPreviousQuantity: Number(totalPreviousQuantity),
        excludedId: excludeId ? Number(excludeId) : null,
      },
      metadata: {
        planId: Number(planId),
        productId: Number(productId),
        productionStepDetailId: Number(productionStepDetailId),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching previous entered quantity:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch previous quantity',
        data: null 
      },
      { status: 500 }
    );
  }
}