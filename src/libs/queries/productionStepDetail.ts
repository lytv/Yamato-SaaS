/**
 * ProductionStepDetail database queries using Drizzle ORM
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Supporting multi-tenancy and business rules for production workflow
 */

import { and, asc, count, desc, eq, gte, ilike, or } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { productionStepDetailSchema, productionStepSchema, productSchema } from '@/models/Schema';
import type {
  CreateProductionStepDetailInput,
  ProductionStepDetailDb,
  ProductionStepDetailListParamsWithOwner,
  ProductionStepDetailStats,
  UpdateProductionStepDetailInput,
} from '@/types/productionStepDetail';

/**
 * Create a new production step detail
 * @param data - Production step detail creation data
 * @returns Promise resolving to created production step detail
 */
export async function createProductionStepDetail(data: CreateProductionStepDetailInput): Promise<ProductionStepDetailDb> {
  const [productionStepDetail] = await db
    .insert(productionStepDetailSchema)
    .values({
      ownerId: data.ownerId,
      productId: data.productId,
      productionStepId: data.productionStepId,
      sequenceNumber: data.sequenceNumber,
      factoryPrice: data.factoryPrice,
      calculatedPrice: data.calculatedPrice,
      quantityLimit1: data.quantityLimit1,
      quantityLimit2: data.quantityLimit2,
      isFinalStep: data.isFinalStep,
      isVtStep: data.isVtStep,
      isParkingStep: data.isParkingStep,
    })
    .returning();

  if (!productionStepDetail) {
    throw new Error('Failed to create production step detail');
  }

  return productionStepDetail;
}

/**
 * Get production step details by owner with pagination and filtering
 * @param params - Query parameters including ownerId, pagination, and filters
 * @returns Promise resolving to array of production step details
 */
export async function getProductionStepDetailsByOwner(params: ProductionStepDetailListParamsWithOwner): Promise<ProductionStepDetailDb[]> {
  const { ownerId, page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc', productId, productionStepId } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(productionStepDetailSchema.ownerId, ownerId);

  // Add product filter if provided
  if (productId) {
    whereConditions = and(whereConditions, eq(productionStepDetailSchema.productId, productId)) || whereConditions;
  }

  // Add production step filter if provided
  if (productionStepId) {
    whereConditions = and(whereConditions, eq(productionStepDetailSchema.productionStepId, productionStepId)) || whereConditions;
  }

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(productionStepDetailSchema.ownerId, ownerId),
      or(
        ilike(productSchema.productName, searchTerm),
        ilike(productSchema.productCode, searchTerm),
        ilike(productionStepSchema.stepName, searchTerm),
        ilike(productionStepSchema.stepCode, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Build sort order
  const sortColumn = productionStepDetailSchema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute query (joins handled separately for search)
  if (search && search.trim() !== '') {
    const results = await db
      .select({
        id: productionStepDetailSchema.id,
        ownerId: productionStepDetailSchema.ownerId,
        productId: productionStepDetailSchema.productId,
        productionStepId: productionStepDetailSchema.productionStepId,
        sequenceNumber: productionStepDetailSchema.sequenceNumber,
        factoryPrice: productionStepDetailSchema.factoryPrice,
        calculatedPrice: productionStepDetailSchema.calculatedPrice,
        quantityLimit1: productionStepDetailSchema.quantityLimit1,
        quantityLimit2: productionStepDetailSchema.quantityLimit2,
        isFinalStep: productionStepDetailSchema.isFinalStep,
        isVtStep: productionStepDetailSchema.isVtStep,
        isParkingStep: productionStepDetailSchema.isParkingStep,
        createdAt: productionStepDetailSchema.createdAt,
        updatedAt: productionStepDetailSchema.updatedAt,
      })
      .from(productionStepDetailSchema)
      .leftJoin(productSchema, eq(productionStepDetailSchema.productId, productSchema.id))
      .leftJoin(productionStepSchema, eq(productionStepDetailSchema.productionStepId, productionStepSchema.id))
      .where(whereConditions)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return results;
  }

  return await db
    .select()
    .from(productionStepDetailSchema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

/**
 * Get total count of production step details for pagination
 * @param ownerId - Owner ID (userId or organizationId)
 * @param search - Optional search term
 * @param productId - Optional product filter
 * @param productionStepId - Optional production step filter
 * @returns Promise resolving to total count
 */
export async function getProductionStepDetailsCount(
  ownerId: string,
  search?: string,
  productId?: number,
  productionStepId?: number,
): Promise<number> {
  // Build where conditions (same logic as getProductionStepDetailsByOwner)
  let whereConditions = eq(productionStepDetailSchema.ownerId, ownerId);

  if (productId) {
    whereConditions = and(whereConditions, eq(productionStepDetailSchema.productId, productId)) || whereConditions;
  }

  if (productionStepId) {
    whereConditions = and(whereConditions, eq(productionStepDetailSchema.productionStepId, productionStepId)) || whereConditions;
  }

  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(productionStepDetailSchema.ownerId, ownerId),
      or(
        ilike(productSchema.productName, searchTerm),
        ilike(productSchema.productCode, searchTerm),
        ilike(productionStepSchema.stepName, searchTerm),
        ilike(productionStepSchema.stepCode, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  let result;
  if (search && search.trim() !== '') {
    const [searchResult] = await db
      .select({ count: count() })
      .from(productionStepDetailSchema)
      .leftJoin(productSchema, eq(productionStepDetailSchema.productId, productSchema.id))
      .leftJoin(productionStepSchema, eq(productionStepDetailSchema.productionStepId, productionStepSchema.id))
      .where(whereConditions);
    result = searchResult;
  } else {
    const [normalResult] = await db
      .select({ count: count() })
      .from(productionStepDetailSchema)
      .where(whereConditions);
    result = normalResult;
  }

  return result?.count ?? 0;
}

/**
 * Get a single production step detail by ID with ownership check
 * @param id - Production step detail ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to production step detail or null if not found
 */
export async function getProductionStepDetailById(id: number, ownerId: string): Promise<ProductionStepDetailDb | null> {
  const [productionStepDetail] = await db
    .select()
    .from(productionStepDetailSchema)
    .where(
      and(
        eq(productionStepDetailSchema.id, id),
        eq(productionStepDetailSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return productionStepDetail ?? null;
}

/**
 * Update a production step detail with ownership check
 * @param id - Production step detail ID
 * @param ownerId - Owner ID for authorization
 * @param data - Update data
 * @returns Promise resolving to updated production step detail
 */
export async function updateProductionStepDetail(
  id: number,
  ownerId: string,
  data: UpdateProductionStepDetailInput,
): Promise<ProductionStepDetailDb> {
  // First check if production step detail exists and belongs to owner
  const existingDetail = await getProductionStepDetailById(id, ownerId);
  if (!existingDetail) {
    throw new Error('Production step detail not found or access denied');
  }

  const [updatedDetail] = await db
    .update(productionStepDetailSchema)
    .set({
      sequenceNumber: data.sequenceNumber ?? existingDetail.sequenceNumber,
      factoryPrice: data.factoryPrice ?? existingDetail.factoryPrice,
      calculatedPrice: data.calculatedPrice ?? existingDetail.calculatedPrice,
      quantityLimit1: data.quantityLimit1 ?? existingDetail.quantityLimit1,
      quantityLimit2: data.quantityLimit2 ?? existingDetail.quantityLimit2,
      isFinalStep: data.isFinalStep ?? existingDetail.isFinalStep,
      isVtStep: data.isVtStep ?? existingDetail.isVtStep,
      isParkingStep: data.isParkingStep ?? existingDetail.isParkingStep,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(productionStepDetailSchema.id, id),
        eq(productionStepDetailSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedDetail) {
    throw new Error('Failed to update production step detail');
  }

  return updatedDetail;
}

/**
 * Delete a production step detail with ownership check
 * @param id - Production step detail ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to true if deleted, false if not found
 */
export async function deleteProductionStepDetail(id: number, ownerId: string): Promise<boolean> {
  // First check if production step detail exists and belongs to owner
  const existingDetail = await getProductionStepDetailById(id, ownerId);
  if (!existingDetail) {
    return false;
  }

  const [deletedDetail] = await db
    .delete(productionStepDetailSchema)
    .where(
      and(
        eq(productionStepDetailSchema.id, id),
        eq(productionStepDetailSchema.ownerId, ownerId),
      ),
    )
    .returning();

  return !!deletedDetail;
}

/**
 * Check if a production step detail exists with ownership check
 * @param id - Production step detail ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to true if exists, false otherwise
 */
export async function productionStepDetailExists(id: number, ownerId: string): Promise<boolean> {
  const detail = await getProductionStepDetailById(id, ownerId);
  return !!detail;
}

/**
 * Get production step detail statistics for dashboard
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to statistics object
 */
export async function getProductionStepDetailStats(ownerId: string): Promise<ProductionStepDetailStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(productionStepDetailSchema)
    .where(eq(productionStepDetailSchema.ownerId, ownerId));

  // Get today count
  const [todayResult] = await db
    .select({ count: count() })
    .from(productionStepDetailSchema)
    .where(
      and(
        eq(productionStepDetailSchema.ownerId, ownerId),
        gte(productionStepDetailSchema.createdAt, todayStart),
      ),
    );

  // Get this week count
  const [weekResult] = await db
    .select({ count: count() })
    .from(productionStepDetailSchema)
    .where(
      and(
        eq(productionStepDetailSchema.ownerId, ownerId),
        gte(productionStepDetailSchema.createdAt, weekStart),
      ),
    );

  // Get this month count
  const [monthResult] = await db
    .select({ count: count() })
    .from(productionStepDetailSchema)
    .where(
      and(
        eq(productionStepDetailSchema.ownerId, ownerId),
        gte(productionStepDetailSchema.createdAt, monthStart),
      ),
    );

  // Get stats by product
  const byProductResults = await db
    .select({
      productName: productSchema.productName,
      count: count(),
    })
    .from(productionStepDetailSchema)
    .leftJoin(productSchema, eq(productionStepDetailSchema.productId, productSchema.id))
    .where(eq(productionStepDetailSchema.ownerId, ownerId))
    .groupBy(productSchema.productName)
    .orderBy(desc(count()))
    .limit(10);

  // Get stats by production step
  const byProductionStepResults = await db
    .select({
      stepName: productionStepSchema.stepName,
      count: count(),
    })
    .from(productionStepDetailSchema)
    .leftJoin(productionStepSchema, eq(productionStepDetailSchema.productionStepId, productionStepSchema.id))
    .where(eq(productionStepDetailSchema.ownerId, ownerId))
    .groupBy(productionStepSchema.stepName)
    .orderBy(desc(count()))
    .limit(10);

  return {
    total: totalResult?.count ?? 0,
    today: todayResult?.count ?? 0,
    thisWeek: weekResult?.count ?? 0,
    thisMonth: monthResult?.count ?? 0,
    byProduct: byProductResults.map(result => ({
      productName: result.productName ?? 'Unknown',
      count: result.count,
    })),
    byProductionStep: byProductionStepResults.map(result => ({
      stepName: result.stepName ?? 'Unknown',
      count: result.count,
    })),
  };
}

/**
 * Get paginated production step details with metadata
 * @param params - Query parameters including pagination and filters
 * @returns Promise resolving to paginated results with metadata
 */
export async function getPaginatedProductionStepDetails(params: ProductionStepDetailListParamsWithOwner): Promise<{
  productionStepDetails: ProductionStepDetailDb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const { page = 1, limit = 10, ownerId, search, productId, productionStepId } = params;

  // Get both data and count in parallel
  const [productionStepDetails, total] = await Promise.all([
    getProductionStepDetailsByOwner(params),
    getProductionStepDetailsCount(ownerId, search, productId, productionStepId),
  ]);

  const hasMore = page * limit < total;

  return {
    productionStepDetails,
    pagination: {
      page,
      limit,
      total,
      hasMore,
    },
  };
}
