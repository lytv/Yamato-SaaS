/**
 * ProductSub database queries using Drizzle ORM
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Supporting multi-tenancy (personal vs organization productsubsubs)
 */

import { and, asc, count, desc, eq, gte, ilike, or } from 'drizzle-orm';

import { productSubSchema } from '@/models/Schema';
import type {
  CreateProductSubInput,
  ProductSubDb,
  ProductSubListParamsWithOwner,
  ProductSubStats,
  UpdateProductSubInput,
} from '@/types/productsub';

import { db } from '../DB';

/**
 * Create a new productsubsub
 * @param data - ProductSub creation data
 * @returns Promise resolving to created productsubsub
 */
export async function createProductSub(data: CreateProductSubInput): Promise<ProductSubDb> {
  const [productSub] = await db
    .insert(productSubSchema)
    .values({
      ownerId: data.ownerId,
      productId: data.productId,
      productCode: (data as any).productCode ?? '',
      productSubCode: data.productsubCode,
      productSubDetail: data.productsubName,
      subCategory: data.category ?? '',
      note: data.notes ?? '',
    })
    .returning();

  if (!productSub) {
    throw new Error('Failed to create productSub');
  }

  return productSub;
}

/**
 * Get productsubsubs by owner with pagination and filtering
 * @param params - Query parameters including ownerId, pagination, and filters
 * @returns Promise resolving to array of productsubsubs
 */
export async function getProductSubsByOwner(params: ProductSubListParamsWithOwner): Promise<ProductSubDb[]> {
  const {
    ownerId,
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    showAll = false,
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(productSubSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(productSubSchema.ownerId, ownerId),
      or(
        ilike(productSubSchema.productSubDetail, searchTerm),
        ilike(productSubSchema.productSubCode, searchTerm),
        ilike(productSubSchema.subCategory, searchTerm),
        ilike(productSubSchema.note, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Build sort order
  let sortColumn;
  switch (sortBy) {
    case 'productsubName':
      sortColumn = productSubSchema.productSubDetail;
      break;
    case 'productsubCode':
      sortColumn = productSubSchema.productSubCode;
      break;
    default:
      sortColumn = productSubSchema[sortBy];
  }
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  const query = db
    .select()
    .from(productSubSchema)
    .where(whereConditions)
    .orderBy(orderBy);

  if (showAll) {
    return await query;
  }

  // Execute query with all conditions
  return await query.limit(limit).offset(offset);
}

/**
 * Get total count of productsubsubs for pagination
 * @param ownerId - Owner ID (userId or organizationId)
 * @param search - Optional search term
 * @returns Promise resolving to total count
 */
export async function getProductSubsCount(ownerId: string, search?: string): Promise<number> {
  // Build where conditions
  let whereConditions = eq(productSubSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(productSubSchema.ownerId, ownerId),
      or(
        ilike(productSubSchema.productSubDetail, searchTerm),
        ilike(productSubSchema.productSubCode, searchTerm),
        ilike(productSubSchema.subCategory, searchTerm),
        ilike(productSubSchema.note, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  const [result] = await db
    .select({ count: count() })
    .from(productSubSchema)
    .where(whereConditions);

  return result?.count ?? 0;
}

/**
 * Get a single productsubsub by ID with ownership check
 * @param id - ProductSub ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to productsubsub or null if not found
 */
export async function getProductSubById(id: number, ownerId: string): Promise<ProductSubDb | null> {
  const [productsubsub] = await db
    .select()
    .from(productSubSchema)
    .where(
      and(
        eq(productSubSchema.id, id),
        eq(productSubSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return productsubsub ?? null;
}

/**
 * Get a productsubsub by productsubsubCode with ownership check (for duplicate detection)
 * @param productsubsubCode - ProductSub code to check
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to productsubsub or null if not found
 */
export async function getProductSubByCode(productSubCode: string, ownerId: string): Promise<ProductSubDb | null> {
  const [productsubsub] = await db
    .select()
    .from(productSubSchema)
    .where(
      and(
        eq(productSubSchema.productSubCode, productSubCode),
        eq(productSubSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return productsubsub ?? null;
}

/**
 * Update a productsubsub with ownership check
 * @param id - ProductSub ID
 * @param ownerId - Owner ID for authorization
 * @param data - Update data
 * @returns Promise resolving to updated productsubsub
 */
export async function updateProductSub(
  id: number,
  ownerId: string,
  data: UpdateProductSubInput,
): Promise<ProductSubDb> {
  // First check if productsubsub exists and belongs to owner
  const existingProductSub = await getProductSubById(id, ownerId);
  if (!existingProductSub) {
    throw new Error('ProductSub not found or access denied');
  }

  const [updatedProductSub] = await db
    .update(productSubSchema)
    .set({
      productSubCode: data.productsubCode ?? existingProductSub.productSubCode,
      productSubDetail: data.productsubName ?? existingProductSub.productSubDetail,
      subCategory: data.category ?? existingProductSub.subCategory,
      note: data.notes ?? existingProductSub.note,
      productId: data.productId ?? existingProductSub.productId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(productSubSchema.id, id),
        eq(productSubSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedProductSub) {
    throw new Error('Failed to update productsubsub');
  }

  return updatedProductSub;
}

/**
 * Delete a productsubsub with ownership check
 * @param id - ProductSub ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteProductSub(id: number, ownerId: string): Promise<boolean> {
  // First check if productsubsub exists and belongs to owner
  const existingProductSub = await getProductSubById(id, ownerId);
  if (!existingProductSub) {
    throw new Error('ProductSub not found or access denied');
  }

  await db
    .delete(productSubSchema)
    .where(
      and(
        eq(productSubSchema.id, id),
        eq(productSubSchema.ownerId, ownerId),
      ),
    );

  return true;
}

/**
 * Get productsubsub statistics for dashboard
 * @param ownerId - Owner ID to get stats for
 * @returns Promise resolving to productsubsub statistics
 */
export async function getProductSubStats(ownerId: string): Promise<ProductSubStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(productSubSchema)
    .where(eq(productSubSchema.ownerId, ownerId));

  // Get today's count
  const [todayResult] = await db
    .select({ count: count() })
    .from(productSubSchema)
    .where(
      and(
        eq(productSubSchema.ownerId, ownerId),
        gte(productSubSchema.createdAt, today),
      ),
    );

  // Get this week's count
  const [weekResult] = await db
    .select({ count: count() })
    .from(productSubSchema)
    .where(
      and(
        eq(productSubSchema.ownerId, ownerId),
        gte(productSubSchema.createdAt, thisWeek),
      ),
    );

  // Get this month's count
  const [monthResult] = await db
    .select({ count: count() })
    .from(productSubSchema)
    .where(
      and(
        eq(productSubSchema.ownerId, ownerId),
        gte(productSubSchema.createdAt, thisMonth),
      ),
    );

  // Get category breakdown
  const categoryResults = await db
    .select({
      name: productSubSchema.subCategory,
      count: count(),
    })
    .from(productSubSchema)
    .where(eq(productSubSchema.ownerId, ownerId))
    .groupBy(productSubSchema.subCategory)
    .orderBy(desc(count()));

  return {
    total: totalResult?.count ?? 0,
    today: todayResult?.count ?? 0,
    thisWeek: weekResult?.count ?? 0,
    thisMonth: monthResult?.count ?? 0,
    categories: categoryResults.map((cat: { name: string | null; count: number }) => ({
      name: cat.name || 'Uncategorized',
      count: cat.count,
    })),
  };
}

/**
 * Check if a productsubsub exists with ownership check
 * @param id - ProductSub ID
 * @param ownerId - Owner ID
 * @returns Promise resolving to boolean
 */
export async function productsubsubExists(id: number, ownerId: string): Promise<boolean> {
  const productsubsub = await getProductSubById(id, ownerId);
  return productsubsub !== null;
}

/**
 * Get paginated productsubsubs with metadata
 * @param params - Query parameters
 * @returns Promise resolving to productsubsubs with pagination metadata
 */
export async function getPaginatedProductSubs(params: ProductSubListParamsWithOwner): Promise<{
  productsubsubs: ProductSubDb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const productsubsubs = await getProductSubsByOwner(params);
  const total = await getProductSubsCount(params.ownerId, params.search);
  const { page = 1, limit = 10, showAll = false } = params;

  if (showAll) {
    return {
      productsubsubs,
      pagination: {
        page: 1,
        limit: total,
        total,
        hasMore: false,
      },
    };
  }

  return {
    productsubsubs,
    pagination: {
      page,
      limit,
      total,
      hasMore: (page * limit) < total,
    },
  };
}
