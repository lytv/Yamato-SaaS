/**
 * OutsourceOrderReceipt Relations Options API Route
 * Generated based on existing pattern from outsourceOrderDetails/relations/options/route.ts
 */

import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { outsourceOrderDetailSchema, userSyncSchema } from '@/models/Schema';

// GET /api/outsourceOrderReceipts/relations/options
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const outsourceOrderDetailId = searchParams.get('outsourceOrderDetailId')
      ? Number(searchParams.get('outsourceOrderDetailId'))
      : undefined;

    // Get OutsourceOrderDetails
    let outsourceOrderDetailsQuery = db
      .select({
        id: outsourceOrderDetailSchema.id,
        planCode: outsourceOrderDetailSchema.planCode,
        planName: outsourceOrderDetailSchema.planName,
        productCode: outsourceOrderDetailSchema.productCode,
        productName: outsourceOrderDetailSchema.productName,
        stepCode: outsourceOrderDetailSchema.stepCode,
        stepName: outsourceOrderDetailSchema.stepName,
        orderedQuantity: outsourceOrderDetailSchema.orderedQuantity,
        completedQuantity: outsourceOrderDetailSchema.completedQuantity,
      })
      .from(outsourceOrderDetailSchema);

    // Filter by ownerId
    const detailConditions = [eq(outsourceOrderDetailSchema.ownerId, ownerId)];

    // Optionally filter by specific outsourceOrderDetailId
    if (outsourceOrderDetailId) {
      detailConditions.push(eq(outsourceOrderDetailSchema.id, outsourceOrderDetailId));
    }

    if (detailConditions.length > 0) {
      outsourceOrderDetailsQuery = outsourceOrderDetailsQuery.where(and(...detailConditions));
    }

    // Get Users (for receivedBy, inspectedBy, deliveredBy dropdowns)
    const usersQuery = db
      .select({
        userId: userSyncSchema.userId,
        fullName: userSyncSchema.fullName,
      })
      .from(userSyncSchema)
      .where(eq(userSyncSchema.isActive, true))
      .orderBy(userSyncSchema.fullName);

    // Execute queries in parallel
    const [outsourceOrderDetails, users] = await Promise.all([
      outsourceOrderDetailsQuery.execute(),
      usersQuery.execute(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        outsourceOrderDetails: outsourceOrderDetails as Array<{
          id: number;
          planCode: string;
          planName: string;
          productCode: string;
          productName: string;
          stepCode: string;
          stepName: string;
          orderedQuantity: number;
          completedQuantity: number | null;
        }>,
        users,
      },
    });
  } catch (error) {
    console.error('GET /api/outsourceOrderReceipts/relations/options error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'NOT_FOUND' },
          { status: 404 },
        );
      }

      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'VALIDATION_ERROR' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
