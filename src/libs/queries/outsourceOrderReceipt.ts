/**
 * OutsourceOrderReceipt database queries using Drizzle ORM with Relations Support
 * Enhanced version with proper error handling, type safety and relationships
 * Generated based on existing pattern from outsourceOrderDetail queries
 */

import { and, asc, count, desc, eq, gte, ilike, or, type SQL, sum } from 'drizzle-orm';

import { db } from '@/libs/DB';
import {
  outsourceOrderDetailSchema,
  outsourceOrderReceiptSchema,
  userSyncSchema,
} from '@/models/Schema';
import type {
  CreateOutsourceOrderReceiptInput,
  OutsourceOrderReceiptDb,
  OutsourceOrderReceiptListParamsWithOwner,
  OutsourceOrderReceiptStats,
  OutsourceOrderReceiptWithRelations,
  UpdateOutsourceOrderReceiptInput,
} from '@/types/outsourceOrderReceipt';

/**
 * Create a new outsourceOrderReceipt with proper date and relation handling
 * Enhanced with backward compatibility for user/org transition
 */
export async function createOutsourceOrderReceipt(data: CreateOutsourceOrderReceiptInput): Promise<OutsourceOrderReceiptDb> {
  // Validate foreign keys exist with backward compatibility
  if (data.outsourceOrderDetailId) {
    // Try with provided ownerId first (org-based approach)
    let detailExists = await db
      .select({
        id: outsourceOrderDetailSchema.id,
        ownerId: outsourceOrderDetailSchema.ownerId,
        orderedQuantity: outsourceOrderDetailSchema.orderedQuantity,
        completedQuantity: outsourceOrderDetailSchema.completedQuantity,
      })
      .from(outsourceOrderDetailSchema)
      .where(and(
        eq(outsourceOrderDetailSchema.id, data.outsourceOrderDetailId),
        eq(outsourceOrderDetailSchema.ownerId, data.ownerId),
      ))
      .limit(1);

    // If not found and ownerId looks like orgId, try with userId pattern
    if (!detailExists.length && data.ownerId.startsWith('org_')) {
      // Try to find with any userId pattern for this detail
      const anyUserDetail = await db
        .select({
          id: outsourceOrderDetailSchema.id,
          ownerId: outsourceOrderDetailSchema.ownerId,
          orderedQuantity: outsourceOrderDetailSchema.orderedQuantity,
          completedQuantity: outsourceOrderDetailSchema.completedQuantity,
        })
        .from(outsourceOrderDetailSchema)
        .where(eq(outsourceOrderDetailSchema.id, data.outsourceOrderDetailId))
        .limit(1);

      if (anyUserDetail.length) {
        // For now, allow access (transition period)
        detailExists = anyUserDetail;
      }
    }

    if (!detailExists.length) {
      throw new Error(`OutsourceOrderDetail ${data.outsourceOrderDetailId} not found or access denied. Requested by: ${data.ownerId}`);
    }

    // Check remaining quantity - get existing receipts for this detail
    const [existingReceiptsSum] = await db
      .select({
        totalReceived: sum(outsourceOrderReceiptSchema.receiptQuantity).mapWith(Number),
      })
      .from(outsourceOrderReceiptSchema)
      .where(and(
        eq(outsourceOrderReceiptSchema.outsourceOrderDetailId, data.outsourceOrderDetailId),
        eq(outsourceOrderReceiptSchema.ownerId, data.ownerId),
      ));

    const existingTotal = existingReceiptsSum?.totalReceived || 0;
    const remainingQuantity = detailExists[0]!.orderedQuantity - existingTotal;

    if (data.receiptQuantity > remainingQuantity) {
      throw new Error(`Receipt quantity ${data.receiptQuantity} exceeds remaining quantity ${remainingQuantity} for this order detail`);
    }
  }

  // Validate users exist (receivedBy is required)
  const receivedByUserExists = await db
    .select({ userId: userSyncSchema.userId })
    .from(userSyncSchema)
    .where(eq(userSyncSchema.userId, data.receivedByUserId))
    .limit(1);

  if (!receivedByUserExists.length) {
    throw new Error(`Received By User ${data.receivedByUserId} not found`);
  }

  // Validate optional users if provided
  if (data.inspectedByUserId) {
    const inspectedByUserExists = await db
      .select({ userId: userSyncSchema.userId })
      .from(userSyncSchema)
      .where(eq(userSyncSchema.userId, data.inspectedByUserId))
      .limit(1);

    if (!inspectedByUserExists.length) {
      throw new Error(`Inspected By User ${data.inspectedByUserId} not found`);
    }
  }

  if (data.deliveredByUserId) {
    const deliveredByUserExists = await db
      .select({ userId: userSyncSchema.userId })
      .from(userSyncSchema)
      .where(eq(userSyncSchema.userId, data.deliveredByUserId))
      .limit(1);

    if (!deliveredByUserExists.length) {
      throw new Error(`Delivered By User ${data.deliveredByUserId} not found`);
    }
  }

  const [outsourceOrderReceipt] = await db
    .insert(outsourceOrderReceiptSchema)
    .values({
      outsourceOrderDetailId: data.outsourceOrderDetailId,
      receiptNumber: data.receiptNumber,
      receiptTitle: data.receiptTitle,
      receiptQuantity: data.receiptQuantity,
      receiptDate: data.receiptDate
        ? (typeof data.receiptDate === 'string'
            ? data.receiptDate
            : data.receiptDate.toISOString().slice(0, 10))
        : null,
      plannedReceiptDate: data.plannedReceiptDate
        ? (typeof data.plannedReceiptDate === 'string'
            ? data.plannedReceiptDate
            : data.plannedReceiptDate.toISOString().slice(0, 10))
        : null,
      qualityStatus: data.qualityStatus ?? 'pending',
      qualityScore: data.qualityScore,
      defectQuantity: data.defectQuantity ?? 0,
      reworkQuantity: data.reworkQuantity ?? 0,
      qualityNotes: data.qualityNotes,
      receivedByUserId: data.receivedByUserId,
      inspectedByUserId: data.inspectedByUserId,
      deliveredByUserId: data.deliveredByUserId,
      batchNumber: data.batchNumber,
      storageLocation: data.storageLocation,
      warehouseCode: data.warehouseCode,
      actualUnitCost: typeof data.actualUnitCost === 'number' ? data.actualUnitCost.toString() : data.actualUnitCost,
      totalCost: typeof data.totalCost === 'number' ? data.totalCost.toString() : data.totalCost,
      notes: data.notes,
      attachments: data.attachments,
      status: data.status ?? 'received',
      isPartialReceipt: data.isPartialReceipt ?? true,
      ownerId: data.ownerId,
    } as typeof outsourceOrderReceiptSchema.$inferInsert)
    .returning();

  if (!outsourceOrderReceipt) {
    throw new Error('Failed to create outsourceOrderReceipt');
  }

  return outsourceOrderReceipt;
}

/**
 * Update an existing outsourceOrderReceipt with proper validation
 */
export async function updateOutsourceOrderReceipt(
  id: number,
  data: UpdateOutsourceOrderReceiptInput,
  ownerId: string,
): Promise<OutsourceOrderReceiptDb> {
  // Check if entity exists and belongs to user
  const existingEntity = await getOutsourceOrderReceiptById(id, ownerId);
  if (!existingEntity) {
    throw new Error('OutsourceOrderReceipt not found or access denied');
  }

  // Validate foreign keys if they're being changed
  if (data.outsourceOrderDetailId !== undefined && data.outsourceOrderDetailId !== existingEntity.outsourceOrderDetailId) {
    const detailExists = await db
      .select({ id: outsourceOrderDetailSchema.id })
      .from(outsourceOrderDetailSchema)
      .where(and(
        eq(outsourceOrderDetailSchema.id, data.outsourceOrderDetailId),
        eq(outsourceOrderDetailSchema.ownerId, ownerId),
      ))
      .limit(1);

    if (!detailExists.length) {
      throw new Error('OutsourceOrderDetail not found or access denied');
    }
  }

  // Validate users if they're being changed
  if (data.receivedByUserId !== undefined && data.receivedByUserId !== existingEntity.receivedByUserId) {
    const userExists = await db
      .select({ userId: userSyncSchema.userId })
      .from(userSyncSchema)
      .where(eq(userSyncSchema.userId, data.receivedByUserId))
      .limit(1);

    if (!userExists.length) {
      throw new Error('Received By User not found');
    }
  }

  if (data.inspectedByUserId !== undefined && data.inspectedByUserId !== existingEntity.inspectedByUserId) {
    const userExists = await db
      .select({ userId: userSyncSchema.userId })
      .from(userSyncSchema)
      .where(eq(userSyncSchema.userId, data.inspectedByUserId))
      .limit(1);

    if (!userExists.length) {
      throw new Error('Inspected By User not found');
    }
  }

  if (data.deliveredByUserId !== undefined && data.deliveredByUserId !== existingEntity.deliveredByUserId) {
    const userExists = await db
      .select({ userId: userSyncSchema.userId })
      .from(userSyncSchema)
      .where(eq(userSyncSchema.userId, data.deliveredByUserId))
      .limit(1);

    if (!userExists.length) {
      throw new Error('Delivered By User not found');
    }
  }

  const updateData: Partial<typeof outsourceOrderReceiptSchema.$inferInsert> = {};

  if (data.outsourceOrderDetailId !== undefined) {
    updateData.outsourceOrderDetailId = data.outsourceOrderDetailId;
  }
  if (data.receiptNumber !== undefined) {
    updateData.receiptNumber = data.receiptNumber;
  }
  if (data.receiptTitle !== undefined) {
    updateData.receiptTitle = data.receiptTitle;
  }
  if (data.receiptQuantity !== undefined) {
    updateData.receiptQuantity = data.receiptQuantity;
  }
  if (data.receiptDate !== undefined) {
    updateData.receiptDate = data.receiptDate
      ? (typeof data.receiptDate === 'string'
          ? data.receiptDate
          : data.receiptDate.toISOString().slice(0, 10))
      : undefined;
  }
  if (data.plannedReceiptDate !== undefined) {
    updateData.plannedReceiptDate = data.plannedReceiptDate
      ? (typeof data.plannedReceiptDate === 'string'
          ? data.plannedReceiptDate
          : data.plannedReceiptDate.toISOString().slice(0, 10))
      : null;
  }
  if (data.qualityStatus !== undefined) {
    updateData.qualityStatus = data.qualityStatus;
  }
  if (data.qualityScore !== undefined) {
    updateData.qualityScore = data.qualityScore;
  }
  if (data.defectQuantity !== undefined) {
    updateData.defectQuantity = data.defectQuantity;
  }
  if (data.reworkQuantity !== undefined) {
    updateData.reworkQuantity = data.reworkQuantity;
  }
  if (data.qualityNotes !== undefined) {
    updateData.qualityNotes = data.qualityNotes;
  }
  if (data.receivedByUserId !== undefined) {
    updateData.receivedByUserId = data.receivedByUserId;
  }
  if (data.inspectedByUserId !== undefined) {
    updateData.inspectedByUserId = data.inspectedByUserId;
  }
  if (data.deliveredByUserId !== undefined) {
    updateData.deliveredByUserId = data.deliveredByUserId;
  }
  if (data.batchNumber !== undefined) {
    updateData.batchNumber = data.batchNumber;
  }
  if (data.storageLocation !== undefined) {
    updateData.storageLocation = data.storageLocation;
  }
  if (data.warehouseCode !== undefined) {
    updateData.warehouseCode = data.warehouseCode;
  }
  if (data.actualUnitCost !== undefined) {
    updateData.actualUnitCost = typeof data.actualUnitCost === 'number' ? data.actualUnitCost.toString() : data.actualUnitCost;
  }
  if (data.totalCost !== undefined) {
    updateData.totalCost = typeof data.totalCost === 'number' ? data.totalCost.toString() : data.totalCost;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }
  if (data.attachments !== undefined) {
    updateData.attachments = data.attachments;
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  if (data.isPartialReceipt !== undefined) {
    updateData.isPartialReceipt = data.isPartialReceipt;
  }

  const [updatedEntity] = await db
    .update(outsourceOrderReceiptSchema)
    .set(updateData)
    .where(and(
      eq(outsourceOrderReceiptSchema.id, id),
      eq(outsourceOrderReceiptSchema.ownerId, ownerId),
    ))
    .returning();

  if (!updatedEntity) {
    throw new Error('Failed to update outsourceOrderReceipt');
  }

  return updatedEntity;
}

/**
 * Delete an outsourceOrderReceipt
 */
export async function deleteOutsourceOrderReceipt(id: number, ownerId: string): Promise<void> {
  const result = await db
    .delete(outsourceOrderReceiptSchema)
    .where(and(
      eq(outsourceOrderReceiptSchema.id, id),
      eq(outsourceOrderReceiptSchema.ownerId, ownerId),
    ));

  if (Array.isArray(result) ? result.length === 0 : false) {
    throw new Error('OutsourceOrderReceipt not found or access denied');
  }
}

/**
 * Get outsourceOrderReceipt by ID
 */
export async function getOutsourceOrderReceiptById(
  id: number,
  ownerId: string,
  includeRelations = false,
): Promise<OutsourceOrderReceiptWithRelations | null> {
  if (includeRelations) {
    const result = await db
      .select({
        outsourceOrderReceipt: outsourceOrderReceiptSchema,
        outsourceOrderDetail: {
          id: outsourceOrderDetailSchema.id,
          planCode: outsourceOrderDetailSchema.planCode,
          planName: outsourceOrderDetailSchema.planName,
          productCode: outsourceOrderDetailSchema.productCode,
          productName: outsourceOrderDetailSchema.productName,
          stepCode: outsourceOrderDetailSchema.stepCode,
          stepName: outsourceOrderDetailSchema.stepName,
          orderedQuantity: outsourceOrderDetailSchema.orderedQuantity,
          completedQuantity: outsourceOrderDetailSchema.completedQuantity,
        },
        receivedByUser: {
          id: userSyncSchema.userId,
          fullName: userSyncSchema.fullName,
        },
        inspectedByUser: {
          id: userSyncSchema.userId,
          fullName: userSyncSchema.fullName,
        },
        deliveredByUser: {
          id: userSyncSchema.userId,
          fullName: userSyncSchema.fullName,
        },
      })
      .from(outsourceOrderReceiptSchema)
      .leftJoin(outsourceOrderDetailSchema, eq(outsourceOrderReceiptSchema.outsourceOrderDetailId, outsourceOrderDetailSchema.id))
      .leftJoin(userSyncSchema, eq(outsourceOrderReceiptSchema.receivedByUserId, userSyncSchema.userId))
      .where(and(
        eq(outsourceOrderReceiptSchema.id, id),
        eq(outsourceOrderReceiptSchema.ownerId, ownerId),
      ))
      .limit(1);

    if (!result.length) {
      return null;
    }
    const row = result[0];
    if (!row) {
      return null;
    }
    return {
      ...row.outsourceOrderReceipt,
      outsourceOrderDetail: row.outsourceOrderDetail,
      receivedByUser: row.receivedByUser ? { ...row.receivedByUser, id: Number(row.receivedByUser.id) } : undefined,
    } as OutsourceOrderReceiptWithRelations;
  }

  const [result] = await db
    .select()
    .from(outsourceOrderReceiptSchema)
    .where(and(
      eq(outsourceOrderReceiptSchema.id, id),
      eq(outsourceOrderReceiptSchema.ownerId, ownerId),
    ))
    .limit(1);

  return result || null;
}

/**
 * Get outsourceOrderReceipts by owner with pagination and filtering
 */
export async function getOutsourceOrderReceiptsByOwner(
  params: OutsourceOrderReceiptListParamsWithOwner,
): Promise<OutsourceOrderReceiptWithRelations[]> {
  const {
    ownerId,
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeRelations = false,
    outsourceOrderDetailId,
    qualityStatus,
    status,
    receivedByUserId,
    batchNumber,
    showAll = false,
  } = params;

  const offset = showAll ? 0 : (page - 1) * limit;
  const take = showAll ? undefined : limit;

  // Build where conditions
  const conditions: SQL[] = [eq(outsourceOrderReceiptSchema.ownerId, ownerId)];

  if (outsourceOrderDetailId) {
    conditions.push(eq(outsourceOrderReceiptSchema.outsourceOrderDetailId, outsourceOrderDetailId));
  }

  if (qualityStatus) {
    conditions.push(eq(outsourceOrderReceiptSchema.qualityStatus, qualityStatus));
  }

  if (status) {
    conditions.push(eq(outsourceOrderReceiptSchema.status, status));
  }

  if (receivedByUserId) {
    conditions.push(eq(outsourceOrderReceiptSchema.receivedByUserId, receivedByUserId));
  }

  if (batchNumber) {
    conditions.push(eq(outsourceOrderReceiptSchema.batchNumber, batchNumber));
  }

  if (search) {
    const orClause = or(
      ilike(outsourceOrderReceiptSchema.receiptNumber, `%${search}%`),
      ilike(outsourceOrderReceiptSchema.receiptTitle, `%${search}%`),
      ilike(outsourceOrderReceiptSchema.batchNumber, `%${search}%`),
      ilike(outsourceOrderReceiptSchema.storageLocation, `%${search}%`),
      ilike(outsourceOrderReceiptSchema.warehouseCode, `%${search}%`),
      ilike(outsourceOrderReceiptSchema.notes, `%${search}%`),
    );
    if (orClause) {
      conditions.push(orClause);
    }
  }

  const whereClause = and(...conditions);

  // Build order clause
  const orderColumn = outsourceOrderReceiptSchema[sortBy] || outsourceOrderReceiptSchema.createdAt;
  const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

  if (includeRelations) {
    const result = await db
      .select({
        outsourceOrderReceipt: outsourceOrderReceiptSchema,
        outsourceOrderDetail: {
          id: outsourceOrderDetailSchema.id,
          planCode: outsourceOrderDetailSchema.planCode,
          planName: outsourceOrderDetailSchema.planName,
          productCode: outsourceOrderDetailSchema.productCode,
          productName: outsourceOrderDetailSchema.productName,
          stepCode: outsourceOrderDetailSchema.stepCode,
          stepName: outsourceOrderDetailSchema.stepName,
          orderedQuantity: outsourceOrderDetailSchema.orderedQuantity,
          completedQuantity: outsourceOrderDetailSchema.completedQuantity,
        },
        receivedByUser: {
          id: userSyncSchema.userId,
          fullName: userSyncSchema.fullName,
        },
      })
      .from(outsourceOrderReceiptSchema)
      .leftJoin(outsourceOrderDetailSchema, eq(outsourceOrderReceiptSchema.outsourceOrderDetailId, outsourceOrderDetailSchema.id))
      .leftJoin(userSyncSchema, eq(outsourceOrderReceiptSchema.receivedByUserId, userSyncSchema.userId))
      .where(whereClause)
      .orderBy(orderDirection)
      .offset(offset)
      .limit(take || 1000);

    return result.map(row => ({
      ...row.outsourceOrderReceipt,
      outsourceOrderDetail: row.outsourceOrderDetail,
      receivedByUser: row.receivedByUser ? { ...row.receivedByUser, id: Number(row.receivedByUser.id) } : undefined,
    } as OutsourceOrderReceiptWithRelations));
  }

  const result = await db
    .select()
    .from(outsourceOrderReceiptSchema)
    .where(whereClause)
    .orderBy(orderDirection)
    .offset(offset)
    .limit(take || 1000);

  return result as OutsourceOrderReceiptWithRelations[];
}

/**
 * Get count of outsourceOrderReceipts by owner with filtering (for pagination)
 */
export async function getOutsourceOrderReceiptsCountByOwner(
  params: OutsourceOrderReceiptListParamsWithOwner,
): Promise<number> {
  const {
    ownerId,
    search,
    outsourceOrderDetailId,
    qualityStatus,
    status,
    receivedByUserId,
    batchNumber,
  } = params;

  // Build where conditions (same as main query)
  const conditions: SQL[] = [eq(outsourceOrderReceiptSchema.ownerId, ownerId)];

  if (outsourceOrderDetailId) {
    conditions.push(eq(outsourceOrderReceiptSchema.outsourceOrderDetailId, outsourceOrderDetailId));
  }

  if (qualityStatus) {
    conditions.push(eq(outsourceOrderReceiptSchema.qualityStatus, qualityStatus));
  }

  if (status) {
    conditions.push(eq(outsourceOrderReceiptSchema.status, status));
  }

  if (receivedByUserId) {
    conditions.push(eq(outsourceOrderReceiptSchema.receivedByUserId, receivedByUserId));
  }

  if (batchNumber) {
    conditions.push(eq(outsourceOrderReceiptSchema.batchNumber, batchNumber));
  }

  if (search) {
    const orClause = or(
      ilike(outsourceOrderReceiptSchema.receiptNumber, `%${search}%`),
      ilike(outsourceOrderReceiptSchema.receiptTitle, `%${search}%`),
      ilike(outsourceOrderReceiptSchema.batchNumber, `%${search}%`),
      ilike(outsourceOrderReceiptSchema.storageLocation, `%${search}%`),
      ilike(outsourceOrderReceiptSchema.warehouseCode, `%${search}%`),
      ilike(outsourceOrderReceiptSchema.notes, `%${search}%`),
    );
    if (orClause) {
      conditions.push(orClause);
    }
  }

  const whereClause = and(...conditions);

  const [result] = await db
    .select({ count: count() })
    .from(outsourceOrderReceiptSchema)
    .where(whereClause);

  return result?.count || 0;
}

/**
 * Get outsourceOrderReceipt statistics
 */
export async function getOutsourceOrderReceiptStats(
  ownerId: string,
  outsourceOrderDetailId?: number,
): Promise<OutsourceOrderReceiptStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Build base condition
  const baseConditions = [eq(outsourceOrderReceiptSchema.ownerId, ownerId)];
  if (outsourceOrderDetailId) {
    baseConditions.push(eq(outsourceOrderReceiptSchema.outsourceOrderDetailId, outsourceOrderDetailId));
  }
  const baseWhere = and(...baseConditions);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(outsourceOrderReceiptSchema)
    .where(baseWhere);

  // Get today's count
  const [todayResult] = await db
    .select({ count: count() })
    .from(outsourceOrderReceiptSchema)
    .where(and(
      baseWhere,
      gte(outsourceOrderReceiptSchema.createdAt, today),
    ));

  // Get this week's count
  const [thisWeekResult] = await db
    .select({ count: count() })
    .from(outsourceOrderReceiptSchema)
    .where(and(
      baseWhere,
      gte(outsourceOrderReceiptSchema.createdAt, thisWeekStart),
    ));

  // Get this month's count
  const [thisMonthResult] = await db
    .select({ count: count() })
    .from(outsourceOrderReceiptSchema)
    .where(and(
      baseWhere,
      gte(outsourceOrderReceiptSchema.createdAt, thisMonthStart),
    ));

  // Get aggregate statistics
  const [aggregateResult] = await db
    .select({
      totalReceiptQuantity: sum(outsourceOrderReceiptSchema.receiptQuantity).mapWith(Number),
      totalDefectQuantity: sum(outsourceOrderReceiptSchema.defectQuantity).mapWith(Number),
      totalReworkQuantity: sum(outsourceOrderReceiptSchema.reworkQuantity).mapWith(Number),
      totalCost: sum(outsourceOrderReceiptSchema.totalCost).mapWith(Number),
    })
    .from(outsourceOrderReceiptSchema)
    .where(baseWhere);

  const totalReceiptQuantity = aggregateResult?.totalReceiptQuantity || 0;
  const totalDefectQuantity = aggregateResult?.totalDefectQuantity || 0;
  const defectRate = totalReceiptQuantity > 0 ? (totalDefectQuantity / totalReceiptQuantity) * 100 : 0;

  return {
    total: totalResult?.count || 0,
    today: todayResult?.count || 0,
    thisWeek: thisWeekResult?.count || 0,
    thisMonth: thisMonthResult?.count || 0,
    totalReceiptQuantity,
    totalDefectQuantity: aggregateResult?.totalDefectQuantity || 0,
    totalReworkQuantity: aggregateResult?.totalReworkQuantity || 0,
    defectRate: Math.round(defectRate * 100) / 100, // Round to 2 decimal places
    totalCost: aggregateResult?.totalCost || 0,
  };
}
