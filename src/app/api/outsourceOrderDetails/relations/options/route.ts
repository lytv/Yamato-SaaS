/**
 * OutsourceOrderDetail Relations Options API Route
 * Provides dropdown data for forms
 * Generated based on existing pattern from outsourceOrders/relations/options/route.ts
 */

import { auth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  outsourceOrderSchema,
  planSchema,
  planDetailSchema,
  productionStepSchema,
  productSchema,
  workTableSchema,
  productSubSchema,
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

    const { searchParams } = new URL(_request.url);
    const planId = searchParams.get('planId')
      ? Number(searchParams.get('planId'))
      : undefined;
    const productSubCode = searchParams.get('productSubCode') || undefined;

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

    // Get products - filter by planId if provided
    let products;
    if (planId) {
      // Get products from plan_detail for selected plan, join with product table for names
      products = await db
        .select({
          id: productSchema.id,
          productCode: planDetailSchema.productCode,
          productName: productSchema.productName,
        })
        .from(planDetailSchema)
        .innerJoin(planSchema, eq(planDetailSchema.planId, planSchema.id))
        .innerJoin(productSchema, eq(planDetailSchema.productCode, productSchema.productCode))
        .where(and(
          eq(planSchema.ownerId, ownerId),
          eq(planDetailSchema.planId, planId)
        ))
        .groupBy(productSchema.id, planDetailSchema.productCode, productSchema.productName)
        .orderBy(planDetailSchema.productCode);
    } else {
      // Get all products if no plan selected
      products = await db
        .select({
          id: productSchema.id,
          productCode: productSchema.productCode,
          productName: productSchema.productName,
        })
        .from(productSchema)
        .where(eq(productSchema.ownerId, ownerId))
        .orderBy(productSchema.productCode);
    }

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

    // Get work tables (locations) - filter by planId and productSubCode if provided
    let workTables;
    if (planId && productSubCode) {
      // Get locations from plan_detail for selected plan and product sub, join with work_table for names
      // Note: plan_detail.location_code maps to work_table.table_code 
      workTables = await db
        .select({
          locationCode: planDetailSchema.locationCode,
          tableName: workTableSchema.tableName,
        })
        .from(planDetailSchema)
        .innerJoin(planSchema, eq(planDetailSchema.planId, planSchema.id))
        .innerJoin(workTableSchema, eq(planDetailSchema.locationCode, workTableSchema.tableCode))
        .where(and(
          eq(planSchema.ownerId, ownerId),
          eq(planDetailSchema.planId, planId),
          eq(planDetailSchema.productSubCode, productSubCode)
        ))
        .groupBy(planDetailSchema.locationCode, workTableSchema.tableName)
        .orderBy(planDetailSchema.locationCode);
    } else {
      // Get all work tables if no plan or product sub selected
      workTables = await db
        .select({
          locationCode: workTableSchema.tableCode, // Use tableCode as locationCode
          tableName: workTableSchema.tableName,
        })
        .from(workTableSchema)
        .where(eq(workTableSchema.ownerId, ownerId))
        .orderBy(workTableSchema.tableCode);
    }

    // Get product subs
    const productSubs = await db
      .select({
        productSubCode: productSubSchema.productSubCode,
        productSubDetail: productSubSchema.productSubDetail,
        productCode: productSubSchema.productCode,
      })
      .from(productSubSchema)
      .where(eq(productSubSchema.ownerId, ownerId))
      .orderBy(productSubSchema.productSubCode);

    const relationOptions = {
      outsourceOrders,
      plans,
      products,
      productionSteps,
      workTables,
      productSubs,
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
