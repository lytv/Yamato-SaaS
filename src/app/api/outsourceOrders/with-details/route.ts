/**
 * OutsourceOrder With Details API Route
 * Creates outsource order with details in a single transaction
 */

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  validateCreateOutsourceOrderWithDetails,
} from '@/libs/validations/outsourceOrder';
import {
  outsourceOrderDetailSchema,
  outsourceOrderSchema,
  planSchema,
  productionStepSchema,
  productSchema,
} from '@/models/Schema';

// POST /api/outsourceOrders/with-details
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validation = validateCreateOutsourceOrderWithDetails(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    // Start transaction to create order and details
    const result = await db.transaction(async (tx: any) => {
      // Create the outsource order header
      const [createdOrder] = await tx
        .insert(outsourceOrderSchema)
        .values({
          ownerId: data.ownerId,
          orderCode: data.orderCode,
          orderTitle: data.orderTitle,
          createdByUserId: data.createdByUserId,
          assignedToUserId: data.assignedToUserId,
          orderDate: data.orderDate,
          expectedCompletionDate: data.expectedCompletionDate,
          status: data.status || 'draft',
          priority: data.priority || 5,
          notes: data.notes,
          applyRetailPrice: data.applyRetailPrice,
        })
        .returning();

      if (!createdOrder) {
        throw new Error('Failed to create outsource order');
      }

      // Fetch related data for each detail
      const orderDetailsToCreate = [];

      for (const [index, detail] of data.details.entries()) {
        // Get plan info
        const [plan] = await tx
          .select({
            planCode: planSchema.planCode,
            planName: planSchema.planName,
          })
          .from(planSchema)
          .where(eq(planSchema.id, detail.planId))
          .limit(1);

        // Get product info
        const [product] = await tx
          .select({
            productCode: productSchema.productCode,
            productName: productSchema.productName,
          })
          .from(productSchema)
          .where(eq(productSchema.id, detail.productId))
          .limit(1);

        // Get production step info
        const [step] = await tx
          .select({
            stepCode: productionStepSchema.stepCode,
            stepName: productionStepSchema.stepName,
          })
          .from(productionStepSchema)
          .where(eq(productionStepSchema.id, detail.productionStepId))
          .limit(1);

        if (!plan || !product || !step) {
          const missingData = { plan: !!plan, product: !!product, step: !!step };
          throw new Error(`Missing reference data for detail ${index + 1}: ${JSON.stringify(missingData)}`);
        }

        orderDetailsToCreate.push({
          ownerId: data.ownerId,
          outsourceOrderId: createdOrder.id,
          planId: detail.planId,
          productId: detail.productId,
          productionStepId: detail.productionStepId,
          planCode: plan.planCode,
          planName: plan.planName,
          productCode: product.productCode,
          productName: product.productName,
          stepCode: step.stepCode,
          stepName: step.stepName,
          orderedQuantity: detail.orderedQuantity,
          completedQuantity: 0,
          expectedCompletionDate: detail.expectedCompletionDate,
          itemNotes: detail.itemNotes,
          unitPrice: detail.unitPrice,
          totalPrice: detail.unitPrice ? detail.orderedQuantity * detail.unitPrice : undefined,
          locationCode: detail.locationCode,
          productSubCode: detail.productSubCode,
          sequenceNumber: detail.sequenceNumber || index + 1,
        });
      }

      const createdDetails = await tx
        .insert(outsourceOrderDetailSchema)
        .values(orderDetailsToCreate)
        .returning();

      return {
        outsourceOrder: createdOrder,
        details: createdDetails,
        created: createdDetails.length,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully created outsource order with ${result.created} details`,
    });
  } catch (error) {
    console.error('POST /api/outsourceOrders/with-details error:', error);
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
