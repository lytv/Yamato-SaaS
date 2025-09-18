/**
 * OutsourceOrderDetail Relations Options API Route
 * Provides dropdown data for forms
 * Generated based on existing pattern from outsourceOrders/relations/options/route.ts
 */

import { auth } from '@clerk/nextjs/server';
import { and, eq, ilike } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import {
  outsourceOrderSchema,
  planDetailSchema,
  planSchema,
  productionStepSchema,
  productSchema,
  productSubSchema,
  userSyncSchema,
  workTableSchema,
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

    // Search parameters for filtering dropdown options
    const assignedUserSearch = searchParams.get('assignedUserSearch') || undefined;
    const productSearch = searchParams.get('productSearch') || undefined;
    const productionStepSearch = searchParams.get('productionStepSearch') || undefined;

    // Get assigned users (from userSyncSchema for assignment)
    let assignedUsersQuery = db
      .select({
        id: userSyncSchema.userId,
        fullName: userSyncSchema.fullName,
        shortcut: userSyncSchema.shortcut,
      })
      .from(userSyncSchema);

    // Add search filter if provided
    if (assignedUserSearch) {
      assignedUsersQuery = assignedUsersQuery.where(
        ilike(userSyncSchema.shortcut, `%${assignedUserSearch}%`),
      );
    }

    const assignedUsers = await assignedUsersQuery.orderBy(userSyncSchema.fullName);

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
      const productsQuery = db
        .select({
          id: productSchema.id,
          productCode: planDetailSchema.productCode,
          productName: productSchema.productName,
          category: productSchema.category,
        })
        .from(planDetailSchema)
        .innerJoin(planSchema, eq(planDetailSchema.planId, planSchema.id))
        .innerJoin(productSchema, eq(planDetailSchema.productCode, productSchema.productCode));

      // Build where conditions
      const whereConditions = [
        eq(planSchema.ownerId, ownerId),
        eq(planDetailSchema.planId, planId),
      ];

      // Add product search filter if provided
      if (productSearch) {
        whereConditions.push(ilike(productSchema.category, `%${productSearch}%`));
      }

      products = await productsQuery
        .where(and(...whereConditions))
        .groupBy(productSchema.id, planDetailSchema.productCode, productSchema.productName, productSchema.category)
        .orderBy(planDetailSchema.productCode);
    } else {
      // Get all products if no plan selected
      const productsQuery = db
        .select({
          id: productSchema.id,
          productCode: productSchema.productCode,
          productName: productSchema.productName,
          category: productSchema.category,
        })
        .from(productSchema);

      // Build where conditions
      const whereConditions = [eq(productSchema.ownerId, ownerId)];

      // Add product search filter if provided
      if (productSearch) {
        whereConditions.push(ilike(productSchema.category, `%${productSearch}%`));
      }

      products = await productsQuery
        .where(and(...whereConditions))
        .orderBy(productSchema.productCode);
    }

    // Get production steps
    const productionStepsQuery = db
      .select({
        id: productionStepSchema.id,
        stepCode: productionStepSchema.stepCode,
        stepName: productionStepSchema.stepName,
        filmSequence: productionStepSchema.filmSequence,
      })
      .from(productionStepSchema);

    // Build where conditions
    const productionStepWhereConditions = [eq(productionStepSchema.ownerId, ownerId)];

    // Add production step search filter if provided (search by filmSequence)
    if (productionStepSearch) {
      productionStepWhereConditions.push(
        ilike(productionStepSchema.filmSequence, `%${productionStepSearch}%`),
      );
    }

    const productionSteps = await productionStepsQuery
      .where(and(...productionStepWhereConditions))
      .orderBy(productionStepSchema.stepCode);

    // Get work tables (locations) - filter by productSubCode if provided (like OutsourceOrderBulkForm)
    let workTables;
    if (productSubCode) {
      // Get locations filtered by product sub code - more flexible dependency chain
      if (planId) {
        // If both planId and productSubCode are provided, use the more specific filter
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
            eq(planDetailSchema.productSubCode, productSubCode),
          ))
          .groupBy(planDetailSchema.locationCode, workTableSchema.tableName)
          .orderBy(planDetailSchema.locationCode);
      } else {
        // If only productSubCode is provided, get all locations that support this product sub
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
            eq(planDetailSchema.productSubCode, productSubCode),
          ))
          .groupBy(planDetailSchema.locationCode, workTableSchema.tableName)
          .orderBy(planDetailSchema.locationCode);
      }
    } else {
      // Get all work tables if no product sub selected
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
      assignedUsers,
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
