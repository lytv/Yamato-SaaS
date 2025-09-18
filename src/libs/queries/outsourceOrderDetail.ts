/**
 * OutsourceOrderDetail database queries using Drizzle ORM with Relations Support
 * Enhanced version with proper error handling, type safety and relationships
 * Generated based on existing pattern from outsourceOrder queries
 */

import { and, asc, count, desc, eq, gte, ilike, lte, or, type SQL, sum } from 'drizzle-orm';

import {
  outsourceOrderDetailSchema,
  outsourceOrderReceiptSchema,
  outsourceOrderSchema,
  planSchema,
  productionStepSchema,
  productSchema,
  productSubSchema,
  userSyncSchema,
  workTableSchema,
} from '@/models/Schema';
import type {
  CreateOutsourceOrderDetailInput,
  OutsourceOrderDetailDb,
  OutsourceOrderDetailListParamsWithOwner,
  OutsourceOrderDetailStats,
  OutsourceOrderDetailWithRelations,
  UpdateOutsourceOrderDetailInput,
} from '@/types/outsourceOrderDetail';

import { db } from '../DB';

/**
 * Create a new outsourceOrderDetail with proper date and relation handling
 * Enhanced with backward compatibility for user/org transition
 */
export async function createOutsourceOrderDetail(data: CreateOutsourceOrderDetailInput): Promise<OutsourceOrderDetailDb> {
  // Validate foreign keys exist with backward compatibility
  if (data.outsourceOrderId) {
    // Try with provided ownerId first (org-based approach)
    let outsourceOrderExists = await db
      .select({ id: outsourceOrderSchema.id, ownerId: outsourceOrderSchema.ownerId })
      .from(outsourceOrderSchema)
      .where(and(
        eq(outsourceOrderSchema.id, data.outsourceOrderId),
        eq(outsourceOrderSchema.ownerId, data.ownerId),
      ))
      .limit(1);

    // If not found and ownerId looks like orgId, try with userId pattern
    if (!outsourceOrderExists.length && data.ownerId.startsWith('org_')) {
      // Try to find with any userId pattern for this order
      const anyUserOrder = await db
        .select({ id: outsourceOrderSchema.id, ownerId: outsourceOrderSchema.ownerId })
        .from(outsourceOrderSchema)
        .where(eq(outsourceOrderSchema.id, data.outsourceOrderId))
        .limit(1);

      if (anyUserOrder.length) {
        // For now, allow access (transition period)
        outsourceOrderExists = anyUserOrder;
      }
    }

    if (!outsourceOrderExists.length) {
      throw new Error(`OutsourceOrder ${data.outsourceOrderId} not found or access denied. Requested by: ${data.ownerId}`);
    }
  }

  if (data.planId) {
    // Try with provided ownerId first
    let planExists = await db
      .select({ id: planSchema.id, ownerId: planSchema.ownerId })
      .from(planSchema)
      .where(and(
        eq(planSchema.id, data.planId),
        eq(planSchema.ownerId, data.ownerId),
      ))
      .limit(1);

    // Backward compatibility check
    if (!planExists.length && data.ownerId.startsWith('org_')) {
      const anyUserPlan = await db
        .select({ id: planSchema.id, ownerId: planSchema.ownerId })
        .from(planSchema)
        .where(eq(planSchema.id, data.planId))
        .limit(1);

      if (anyUserPlan.length) {
        planExists = anyUserPlan;
      }
    }

    if (!planExists.length) {
      throw new Error(`Plan ${data.planId} not found or access denied. Requested by: ${data.ownerId}`);
    }
  }

  if (data.productId) {
    // Try with provided ownerId first
    let productExists = await db
      .select({ id: productSchema.id, ownerId: productSchema.ownerId })
      .from(productSchema)
      .where(and(
        eq(productSchema.id, data.productId),
        eq(productSchema.ownerId, data.ownerId),
      ))
      .limit(1);

    // Backward compatibility check
    if (!productExists.length && data.ownerId.startsWith('org_')) {
      const anyUserProduct = await db
        .select({ id: productSchema.id, ownerId: productSchema.ownerId })
        .from(productSchema)
        .where(eq(productSchema.id, data.productId))
        .limit(1);

      if (anyUserProduct.length) {
        productExists = anyUserProduct;
      }
    }

    if (!productExists.length) {
      throw new Error(`Product ${data.productId} not found or access denied. Requested by: ${data.ownerId}`);
    }
  }

  if (data.productionStepId) {
    // Try with provided ownerId first
    let productionStepExists = await db
      .select({ id: productionStepSchema.id, ownerId: productionStepSchema.ownerId })
      .from(productionStepSchema)
      .where(and(
        eq(productionStepSchema.id, data.productionStepId),
        eq(productionStepSchema.ownerId, data.ownerId),
      ))
      .limit(1);

    // Backward compatibility check
    if (!productionStepExists.length && data.ownerId.startsWith('org_')) {
      const anyUserStep = await db
        .select({ id: productionStepSchema.id, ownerId: productionStepSchema.ownerId })
        .from(productionStepSchema)
        .where(eq(productionStepSchema.id, data.productionStepId))
        .limit(1);

      if (anyUserStep.length) {
        productionStepExists = anyUserStep;
      }
    }

    if (!productionStepExists.length) {
      throw new Error(`ProductionStep ${data.productionStepId} not found or access denied. Requested by: ${data.ownerId}`);
    }
  }

  const [outsourceOrderDetail] = await db
    .insert(outsourceOrderDetailSchema)
    .values({
      outsourceOrderId: data.outsourceOrderId,
      planId: data.planId,
      productId: data.productId,
      productionStepId: data.productionStepId,
      planCode: data.planCode,
      planName: data.planName,
      productCode: data.productCode,
      productName: data.productName,
      stepCode: data.stepCode,
      stepName: data.stepName,
      locationCode: data.locationCode,
      productSubCode: data.productSubCode,
      orderedQuantity: data.orderedQuantity,
      completedQuantity: data.completedQuantity ?? 0,
      expectedCompletionDate: data.expectedCompletionDate
        ? (typeof data.expectedCompletionDate === 'string'
            ? data.expectedCompletionDate
            : data.expectedCompletionDate.toISOString().slice(0, 10))
        : null,
      actualCompletionDate: data.actualCompletionDate
        ? (typeof data.actualCompletionDate === 'string'
            ? data.actualCompletionDate
            : data.actualCompletionDate.toISOString().slice(0, 10))
        : null,
      status: data.status ?? 'pending',
      sequenceNumber: data.sequenceNumber,
      unitPrice: typeof data.unitPrice === 'number' ? data.unitPrice.toString() : data.unitPrice,
      totalPrice: typeof data.totalPrice === 'number' ? data.totalPrice.toString() : data.totalPrice,
      itemNotes: data.itemNotes,
      ownerId: data.ownerId,
    } as typeof outsourceOrderDetailSchema.$inferInsert)
    .returning();

  if (!outsourceOrderDetail) {
    throw new Error('Failed to create outsourceOrderDetail');
  }

  return outsourceOrderDetail;
}

/**
 * Update an existing outsourceOrderDetail with proper validation
 */
export async function updateOutsourceOrderDetail(
  id: number,
  data: UpdateOutsourceOrderDetailInput,
  ownerId: string,
): Promise<OutsourceOrderDetailDb> {
  // Check if entity exists and belongs to user
  const existingEntity = await getOutsourceOrderDetailById(id, ownerId);
  if (!existingEntity) {
    throw new Error('OutsourceOrderDetail not found or access denied');
  }

  // Validate foreign keys if they're being changed
  if (data.outsourceOrderId !== undefined && data.outsourceOrderId !== existingEntity.outsourceOrderId) {
    const outsourceOrderExists = await db
      .select({ id: outsourceOrderSchema.id })
      .from(outsourceOrderSchema)
      .where(and(
        eq(outsourceOrderSchema.id, data.outsourceOrderId),
        eq(outsourceOrderSchema.ownerId, ownerId),
      ))
      .limit(1);

    if (!outsourceOrderExists.length) {
      throw new Error('OutsourceOrder not found or access denied');
    }
  }

  if (data.planId !== undefined && data.planId !== existingEntity.planId) {
    const planExists = await db
      .select({ id: planSchema.id })
      .from(planSchema)
      .where(and(
        eq(planSchema.id, data.planId),
        eq(planSchema.ownerId, ownerId),
      ))
      .limit(1);

    if (!planExists.length) {
      throw new Error('Plan not found or access denied');
    }
  }

  if (data.productId !== undefined && data.productId !== existingEntity.productId) {
    const productExists = await db
      .select({ id: productSchema.id })
      .from(productSchema)
      .where(and(
        eq(productSchema.id, data.productId),
        eq(productSchema.ownerId, ownerId),
      ))
      .limit(1);

    if (!productExists.length) {
      throw new Error('Product not found or access denied');
    }
  }

  if (data.productionStepId !== undefined && data.productionStepId !== existingEntity.productionStepId) {
    const productionStepExists = await db
      .select({ id: productionStepSchema.id })
      .from(productionStepSchema)
      .where(and(
        eq(productionStepSchema.id, data.productionStepId),
        eq(productionStepSchema.ownerId, ownerId),
      ))
      .limit(1);

    if (!productionStepExists.length) {
      throw new Error('ProductionStep not found or access denied');
    }
  }

  const updateData: Partial<typeof outsourceOrderDetailSchema.$inferInsert> = {};

  if (data.outsourceOrderId !== undefined) {
    updateData.outsourceOrderId = data.outsourceOrderId;
  }
  if (data.planId !== undefined) {
    updateData.planId = data.planId;
  }
  if (data.productId !== undefined) {
    updateData.productId = data.productId;
  }
  if (data.productionStepId !== undefined) {
    updateData.productionStepId = data.productionStepId;
  }
  if (data.planCode !== undefined) {
    updateData.planCode = data.planCode;
  }
  if (data.planName !== undefined) {
    updateData.planName = data.planName;
  }
  if (data.productCode !== undefined) {
    updateData.productCode = data.productCode;
  }
  if (data.productName !== undefined) {
    updateData.productName = data.productName;
  }
  if (data.stepCode !== undefined) {
    updateData.stepCode = data.stepCode;
  }
  if (data.stepName !== undefined) {
    updateData.stepName = data.stepName;
  }
  if (data.orderedQuantity !== undefined) {
    updateData.orderedQuantity = data.orderedQuantity;
  }
  if (data.completedQuantity !== undefined) {
    updateData.completedQuantity = data.completedQuantity;
  }
  if (data.expectedCompletionDate !== undefined) {
    updateData.expectedCompletionDate = data.expectedCompletionDate
      ? (typeof data.expectedCompletionDate === 'string'
          ? data.expectedCompletionDate
          : data.expectedCompletionDate.toISOString().slice(0, 10))
      : undefined;
  }
  if (data.actualCompletionDate !== undefined) {
    updateData.actualCompletionDate = data.actualCompletionDate
      ? (typeof data.actualCompletionDate === 'string'
          ? data.actualCompletionDate
          : data.actualCompletionDate.toISOString().slice(0, 10))
      : null;
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  if (data.sequenceNumber !== undefined) {
    updateData.sequenceNumber = data.sequenceNumber;
  }
  if (data.unitPrice !== undefined) {
    updateData.unitPrice = typeof data.unitPrice === 'number' ? data.unitPrice.toString() : data.unitPrice;
  }
  if (data.totalPrice !== undefined) {
    updateData.totalPrice = typeof data.totalPrice === 'number' ? data.totalPrice.toString() : data.totalPrice;
  }
  if (data.itemNotes !== undefined) {
    updateData.itemNotes = data.itemNotes;
  }

  const [updatedEntity] = await db
    .update(outsourceOrderDetailSchema)
    .set(updateData)
    .where(and(
      eq(outsourceOrderDetailSchema.id, id),
      eq(outsourceOrderDetailSchema.ownerId, ownerId),
    ))
    .returning();

  if (!updatedEntity) {
    throw new Error('Failed to update outsourceOrderDetail');
  }

  return updatedEntity;
}

/**
 * Delete an outsourceOrderDetail
 */
export async function deleteOutsourceOrderDetail(id: number, ownerId: string): Promise<void> {
  // First check if the record exists and belongs to the user
  const existingRecord = await getOutsourceOrderDetailById(id, ownerId);
  if (!existingRecord) {
    throw new Error('OutsourceOrderDetail not found or access denied');
  }

  // Delete the record
  await db
    .delete(outsourceOrderDetailSchema)
    .where(and(
      eq(outsourceOrderDetailSchema.id, id),
      eq(outsourceOrderDetailSchema.ownerId, ownerId),
    ));
}

/**
 * Get outsourceOrderDetail by ID
 */
export async function getOutsourceOrderDetailById(
  id: number,
  ownerId: string,
  includeRelations = false,
): Promise<OutsourceOrderDetailWithRelations | null> {
  if (includeRelations) {
    const result = await db
      .select({
        outsourceOrderDetail: outsourceOrderDetailSchema,
        outsourceOrder: {
          id: outsourceOrderSchema.id,
          orderCode: outsourceOrderSchema.orderCode,
          orderTitle: outsourceOrderSchema.orderTitle,
          status: outsourceOrderSchema.status,
          assignedToUserId: outsourceOrderSchema.assignedToUserId,
          orderDate: outsourceOrderSchema.orderDate,
          createdByUserId: outsourceOrderSchema.createdByUserId,
        },
        assignedToUser: {
          fullName: userSyncSchema.fullName,
          shortcut: userSyncSchema.shortcut,
        },
        plan: {
          id: planSchema.id,
          planCode: planSchema.planCode,
          planName: planSchema.planName,
        },
        product: {
          id: productSchema.id,
          productCode: productSchema.productCode,
          productName: productSchema.productName,
          category: productSchema.category,
        },
        productionStep: {
          id: productionStepSchema.id,
          stepCode: productionStepSchema.stepCode,
          stepName: productionStepSchema.stepName,
          filmSequence: productionStepSchema.filmSequence,
        },
        workTable: {
          locationCode: workTableSchema.tableCode,
          tableName: workTableSchema.tableName,
        },
        productSub: {
          productSubCode: productSubSchema.productSubCode,
          productSubDetail: productSubSchema.productSubDetail,
          productCode: productSubSchema.productCode,
        },
      })
      .from(outsourceOrderDetailSchema)
      .leftJoin(outsourceOrderSchema, eq(outsourceOrderDetailSchema.outsourceOrderId, outsourceOrderSchema.id))
      .leftJoin(userSyncSchema, eq(outsourceOrderSchema.assignedToUserId, userSyncSchema.userId))
      .leftJoin(planSchema, eq(outsourceOrderDetailSchema.planId, planSchema.id))
      .leftJoin(productSchema, eq(outsourceOrderDetailSchema.productId, productSchema.id))
      .leftJoin(productionStepSchema, eq(outsourceOrderDetailSchema.productionStepId, productionStepSchema.id))
      .leftJoin(workTableSchema, eq(outsourceOrderDetailSchema.locationCode, workTableSchema.tableCode))
      .leftJoin(productSubSchema, eq(outsourceOrderDetailSchema.productSubCode, productSubSchema.productSubCode))
      .where(and(
        eq(outsourceOrderDetailSchema.id, id),
        eq(outsourceOrderDetailSchema.ownerId, ownerId),
      ))
      .limit(1);

    if (!result.length) {
      return null;
    }
    const row = result[0];
    if (!row) {
      return null;
    }

    // Get receipt quantity for this detail item
    const receiptQuantity = await db
      .select({ sum: sum(outsourceOrderReceiptSchema.receiptQuantity) })
      .from(outsourceOrderReceiptSchema)
      .where(eq(outsourceOrderReceiptSchema.outsourceOrderDetailId, row.outsourceOrderDetail.id));

    return {
      ...row.outsourceOrderDetail,
      outsourceOrder: {
        ...row.outsourceOrder,
        assignedToUser: row.assignedToUser,
      },
      plan: row.plan,
      product: row.product,
      productionStep: row.productionStep,
      workTable: row.workTable,
      productSub: row.productSub,
      // Override completedQuantity with actual receipt quantity
      completedQuantity: Number(receiptQuantity[0]?.sum) || 0,
    } as OutsourceOrderDetailWithRelations;
  }

  const [result] = await db
    .select()
    .from(outsourceOrderDetailSchema)
    .where(and(
      eq(outsourceOrderDetailSchema.id, id),
      eq(outsourceOrderDetailSchema.ownerId, ownerId),
    ))
    .limit(1);

  return result || null;
}

/**
 * Get outsourceOrderDetails by owner with pagination and filtering
 */
export async function getOutsourceOrderDetailsByOwner(
  params: OutsourceOrderDetailListParamsWithOwner,
): Promise<OutsourceOrderDetailWithRelations[]> {
  const {
    ownerId,
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeRelations = false,
    outsourceOrderId,
    status,
    planId,
    productId,
    productionStepId,
    assignedToUserId,
    orderStartDate,
    orderEndDate,
    showAll = false,
  } = params;

  const offset = showAll ? 0 : (page - 1) * limit;
  const take = showAll ? undefined : limit;

  // Build where conditions
  const conditions: SQL[] = [eq(outsourceOrderDetailSchema.ownerId, ownerId)];

  if (outsourceOrderId) {
    conditions.push(eq(outsourceOrderDetailSchema.outsourceOrderId, outsourceOrderId));
  }

  if (status) {
    conditions.push(eq(outsourceOrderDetailSchema.status, status));
  }

  if (planId) {
    conditions.push(eq(outsourceOrderDetailSchema.planId, planId));
  }

  if (productId) {
    conditions.push(eq(outsourceOrderDetailSchema.productId, productId));
  }

  if (productionStepId) {
    conditions.push(eq(outsourceOrderDetailSchema.productionStepId, productionStepId));
  }

  // Date range filtering - filter by order date
  if (orderStartDate) {
    conditions.push(gte(outsourceOrderSchema.orderDate, orderStartDate));
  }

  if (orderEndDate) {
    conditions.push(lte(outsourceOrderSchema.orderDate, orderEndDate));
  }

  // Assigned user filtering (requires join with outsourceOrder)
  if (assignedToUserId) {
    conditions.push(eq(outsourceOrderSchema.assignedToUserId, assignedToUserId));
  }

  if (search) {
    const orClause = or(
      ilike(outsourceOrderDetailSchema.planCode, `%${search}%`),
      ilike(outsourceOrderDetailSchema.planName, `%${search}%`),
      ilike(outsourceOrderDetailSchema.productCode, `%${search}%`),
      ilike(outsourceOrderDetailSchema.productName, `%${search}%`),
      ilike(outsourceOrderDetailSchema.stepCode, `%${search}%`),
      ilike(outsourceOrderDetailSchema.stepName, `%${search}%`),
      ilike(outsourceOrderDetailSchema.itemNotes, `%${search}%`),
    );
    if (orClause) {
      conditions.push(orClause);
    }
  }

  const whereClause = and(...conditions);

  // Build order clause
  const orderColumn = outsourceOrderDetailSchema[sortBy] || outsourceOrderDetailSchema.createdAt;
  const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

  if (includeRelations) {
    const result = await db
      .select({
        outsourceOrderDetail: outsourceOrderDetailSchema,
        outsourceOrder: {
          id: outsourceOrderSchema.id,
          orderCode: outsourceOrderSchema.orderCode,
          orderTitle: outsourceOrderSchema.orderTitle,
          status: outsourceOrderSchema.status,
          assignedToUserId: outsourceOrderSchema.assignedToUserId,
          orderDate: outsourceOrderSchema.orderDate,
          createdByUserId: outsourceOrderSchema.createdByUserId,
        },
        assignedToUser: {
          fullName: userSyncSchema.fullName,
          shortcut: userSyncSchema.shortcut,
        },
        plan: {
          id: planSchema.id,
          planCode: planSchema.planCode,
          planName: planSchema.planName,
        },
        product: {
          id: productSchema.id,
          productCode: productSchema.productCode,
          productName: productSchema.productName,
          category: productSchema.category,
        },
        productionStep: {
          id: productionStepSchema.id,
          stepCode: productionStepSchema.stepCode,
          stepName: productionStepSchema.stepName,
          filmSequence: productionStepSchema.filmSequence,
        },
        workTable: {
          locationCode: workTableSchema.tableCode,
          tableName: workTableSchema.tableName,
        },
        productSub: {
          productSubCode: productSubSchema.productSubCode,
          productSubDetail: productSubSchema.productSubDetail,
          productCode: productSubSchema.productCode,
        },
      })
      .from(outsourceOrderDetailSchema)
      .innerJoin(outsourceOrderSchema, eq(outsourceOrderDetailSchema.outsourceOrderId, outsourceOrderSchema.id))
      .leftJoin(userSyncSchema, eq(outsourceOrderSchema.assignedToUserId, userSyncSchema.userId))
      .leftJoin(planSchema, eq(outsourceOrderDetailSchema.planId, planSchema.id))
      .leftJoin(productSchema, eq(outsourceOrderDetailSchema.productId, productSchema.id))
      .leftJoin(productionStepSchema, eq(outsourceOrderDetailSchema.productionStepId, productionStepSchema.id))
      .leftJoin(workTableSchema, eq(outsourceOrderDetailSchema.locationCode, workTableSchema.tableCode))
      .leftJoin(productSubSchema, eq(outsourceOrderDetailSchema.productSubCode, productSubSchema.productSubCode))
      .where(whereClause)
      .orderBy(orderDirection)
      .offset(offset)
      .limit(take || 1000);

    // Manually calculate receipt quantities for each item
    const itemsWithReceipts = await Promise.all(
      result.map(async (row: {
        outsourceOrderDetail: typeof outsourceOrderDetailSchema.$inferSelect;
        outsourceOrder: { id: number; orderCode: string; orderTitle: string; status: string; assignedToUserId: string; orderDate: string; createdByUserId: string };
        assignedToUser: { fullName: string | null };
        plan: { id: number; planCode: string; planName: string };
        product: { id: number; productCode: string; productName: string };
        productionStep: { id: number; stepCode: string; stepName: string };
        workTable: { locationCode: string; tableName: string };
        productSub: { productSubCode: string; productSubDetail: string; productCode: string };
      }) => {
        const receiptQuantity = await db
          .select({ sum: sum(outsourceOrderReceiptSchema.receiptQuantity) })
          .from(outsourceOrderReceiptSchema)
          .where(eq(outsourceOrderReceiptSchema.outsourceOrderDetailId, row.outsourceOrderDetail.id));

        return {
          ...row.outsourceOrderDetail,
          outsourceOrder: {
            ...row.outsourceOrder,
            assignedToUser: row.assignedToUser,
          },
          plan: row.plan,
          product: row.product,
          productionStep: row.productionStep,
          workTable: row.workTable,
          productSub: row.productSub,
          // Override completedQuantity with actual receipt quantity
          completedQuantity: Number(receiptQuantity[0]?.sum) || 0,
        } as OutsourceOrderDetailWithRelations;
      }),
    );

    return itemsWithReceipts;
  }

  const result = await db
    .select()
    .from(outsourceOrderDetailSchema)
    .where(whereClause)
    .orderBy(orderDirection)
    .offset(offset)
    .limit(take || 1000);

  return result as OutsourceOrderDetailWithRelations[];
}

/**
 * Get count of outsourceOrderDetails by owner with filtering (for pagination)
 */
export async function getOutsourceOrderDetailsCountByOwner(
  params: OutsourceOrderDetailListParamsWithOwner,
): Promise<number> {
  const {
    ownerId,
    search,
    outsourceOrderId,
    status,
    planId,
    productId,
    productionStepId,
  } = params;

  // Build where conditions (same as main query)
  const conditions: SQL[] = [eq(outsourceOrderDetailSchema.ownerId, ownerId)];

  if (outsourceOrderId) {
    conditions.push(eq(outsourceOrderDetailSchema.outsourceOrderId, outsourceOrderId));
  }

  if (status) {
    conditions.push(eq(outsourceOrderDetailSchema.status, status));
  }

  if (planId) {
    conditions.push(eq(outsourceOrderDetailSchema.planId, planId));
  }

  if (productId) {
    conditions.push(eq(outsourceOrderDetailSchema.productId, productId));
  }

  if (productionStepId) {
    conditions.push(eq(outsourceOrderDetailSchema.productionStepId, productionStepId));
  }

  if (search) {
    const orClause = or(
      ilike(outsourceOrderDetailSchema.planCode, `%${search}%`),
      ilike(outsourceOrderDetailSchema.planName, `%${search}%`),
      ilike(outsourceOrderDetailSchema.productCode, `%${search}%`),
      ilike(outsourceOrderDetailSchema.productName, `%${search}%`),
      ilike(outsourceOrderDetailSchema.stepCode, `%${search}%`),
      ilike(outsourceOrderDetailSchema.stepName, `%${search}%`),
      ilike(outsourceOrderDetailSchema.itemNotes, `%${search}%`),
    );
    if (orClause) {
      conditions.push(orClause);
    }
  }

  const whereClause = and(...conditions);

  const [result] = await db
    .select({ count: count() })
    .from(outsourceOrderDetailSchema)
    .where(whereClause);

  return result?.count || 0;
}
export async function getOutsourceOrderDetailStats(
  ownerId: string,
  outsourceOrderId?: number,
): Promise<OutsourceOrderDetailStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Build base condition
  const baseConditions = [eq(outsourceOrderDetailSchema.ownerId, ownerId)];
  if (outsourceOrderId) {
    baseConditions.push(eq(outsourceOrderDetailSchema.outsourceOrderId, outsourceOrderId));
  }
  const baseWhere = and(...baseConditions);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(outsourceOrderDetailSchema)
    .where(baseWhere);

  // Get today's count
  const [todayResult] = await db
    .select({ count: count() })
    .from(outsourceOrderDetailSchema)
    .where(and(
      baseWhere,
      gte(outsourceOrderDetailSchema.createdAt, today),
    ));

  // Get this week's count
  const [thisWeekResult] = await db
    .select({ count: count() })
    .from(outsourceOrderDetailSchema)
    .where(and(
      baseWhere,
      gte(outsourceOrderDetailSchema.createdAt, thisWeekStart),
    ));

  // Get this month's count
  const [thisMonthResult] = await db
    .select({ count: count() })
    .from(outsourceOrderDetailSchema)
    .where(and(
      baseWhere,
      gte(outsourceOrderDetailSchema.createdAt, thisMonthStart),
    ));

  // Get total ordered quantity from outsourceOrderDetail
  const orderedQuantityStats = await db
    .select({
      totalOrderedQuantity: sum(outsourceOrderDetailSchema.orderedQuantity),
    })
    .from(outsourceOrderDetailSchema)
    .where(baseWhere);

  const totalOrderedQuantity = Number(orderedQuantityStats[0]?.totalOrderedQuantity) || 0;

  // Get total completed quantity from outsourceOrderReceipt (sum of all receipt quantities)
  const completedConditions = [eq(outsourceOrderDetailSchema.ownerId, ownerId)];
  if (outsourceOrderId) {
    completedConditions.push(eq(outsourceOrderDetailSchema.outsourceOrderId, outsourceOrderId));
  }

  const completedQuantityStats = await db
    .select({
      totalCompletedQuantity: sum(outsourceOrderReceiptSchema.receiptQuantity),
    })
    .from(outsourceOrderReceiptSchema)
    .innerJoin(outsourceOrderDetailSchema, eq(outsourceOrderReceiptSchema.outsourceOrderDetailId, outsourceOrderDetailSchema.id))
    .where(and(...completedConditions));
  const totalCompletedQuantity = Number(completedQuantityStats[0]?.totalCompletedQuantity) || 0;

  // Calculate completion rate
  const completionRate = totalOrderedQuantity > 0
    ? totalCompletedQuantity / totalOrderedQuantity
    : 0;

  return {
    total: totalResult?.count || 0,
    today: todayResult?.count || 0,
    thisWeek: thisWeekResult?.count || 0,
    thisMonth: thisMonthResult?.count || 0,
    totalOrderedQuantity,
    totalCompletedQuantity,
    completionRate,
  };
}
