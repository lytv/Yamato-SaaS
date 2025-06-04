/**
 * Product database queries using Drizzle ORM
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Supporting multi-tenancy (personal vs organization products)
 */

import { and, asc, count, desc, eq, gte, ilike, or } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { productSchema } from '@/models/Schema';
import type {
  CreateProductInput,
  ProductDb,
  ProductListParamsWithOwner,
  ProductStats,
  UpdateProductInput,
} from '@/types/product';

/**
 * Create a new product
 * @param data - Product creation data
 * @returns Promise resolving to created product
 */
export async function createProduct(data: CreateProductInput): Promise<ProductDb> {
  const [product] = await db
    .insert(productSchema)
    .values({
      ownerId: data.ownerId,
      productCode: data.productCode,
      productName: data.productName,
      category: data.category,
      notes: data.notes,
    })
    .returning();

  if (!product) {
    throw new Error('Failed to create product');
  }

  return product;
}

/**
 * Get products by owner with pagination and filtering
 * @param params - Query parameters including ownerId, pagination, and filters
 * @returns Promise resolving to array of products
 */
export async function getProductsByOwner(params: ProductListParamsWithOwner): Promise<ProductDb[]> {
  const { ownerId, page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(productSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(productSchema.ownerId, ownerId),
      or(
        ilike(productSchema.productName, searchTerm),
        ilike(productSchema.productCode, searchTerm),
        ilike(productSchema.category, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Build sort order
  const sortColumn = productSchema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute query with all conditions
  return await db
    .select()
    .from(productSchema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

/**
 * Get total count of products for pagination
 * @param ownerId - Owner ID (userId or organizationId)
 * @param search - Optional search term
 * @returns Promise resolving to total count
 */
export async function getProductsCount(ownerId: string, search?: string): Promise<number> {
  // Build where conditions
  let whereConditions = eq(productSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(productSchema.ownerId, ownerId),
      or(
        ilike(productSchema.productName, searchTerm),
        ilike(productSchema.productCode, searchTerm),
        ilike(productSchema.category, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  const [result] = await db
    .select({ count: count() })
    .from(productSchema)
    .where(whereConditions);

  return result?.count ?? 0;
}

/**
 * Get a single product by ID with ownership check
 * @param id - Product ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to product or null if not found
 */
export async function getProductById(id: number, ownerId: string): Promise<ProductDb | null> {
  const [product] = await db
    .select()
    .from(productSchema)
    .where(
      and(
        eq(productSchema.id, id),
        eq(productSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return product ?? null;
}

/**
 * Get a product by productCode with ownership check (for duplicate detection)
 * @param productCode - Product code to check
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to product or null if not found
 */
export async function getProductByCode(productCode: string, ownerId: string): Promise<ProductDb | null> {
  const [product] = await db
    .select()
    .from(productSchema)
    .where(
      and(
        eq(productSchema.productCode, productCode),
        eq(productSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return product ?? null;
}

/**
 * Update a product with ownership check
 * @param id - Product ID
 * @param ownerId - Owner ID for authorization
 * @param data - Update data
 * @returns Promise resolving to updated product
 */
export async function updateProduct(
  id: number,
  ownerId: string,
  data: UpdateProductInput,
): Promise<ProductDb> {
  // First check if product exists and belongs to owner
  const existingProduct = await getProductById(id, ownerId);
  if (!existingProduct) {
    throw new Error('Product not found or access denied');
  }

  const [updatedProduct] = await db
    .update(productSchema)
    .set({
      productCode: data.productCode ?? existingProduct.productCode,
      productName: data.productName ?? existingProduct.productName,
      category: data.category ?? existingProduct.category,
      notes: data.notes ?? existingProduct.notes,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(productSchema.id, id),
        eq(productSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedProduct) {
    throw new Error('Failed to update product');
  }

  return updatedProduct;
}

/**
 * Delete a product with ownership check
 * @param id - Product ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteProduct(id: number, ownerId: string): Promise<boolean> {
  // First check if product exists and belongs to owner
  const existingProduct = await getProductById(id, ownerId);
  if (!existingProduct) {
    throw new Error('Product not found or access denied');
  }

  await db
    .delete(productSchema)
    .where(
      and(
        eq(productSchema.id, id),
        eq(productSchema.ownerId, ownerId),
      ),
    );

  return true;
}

/**
 * Get product statistics for dashboard
 * @param ownerId - Owner ID to get stats for
 * @returns Promise resolving to product statistics
 */
export async function getProductStats(ownerId: string): Promise<ProductStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(productSchema)
    .where(eq(productSchema.ownerId, ownerId));

  // Get today's count
  const [todayResult] = await db
    .select({ count: count() })
    .from(productSchema)
    .where(
      and(
        eq(productSchema.ownerId, ownerId),
        gte(productSchema.createdAt, today),
      ),
    );

  // Get this week's count
  const [weekResult] = await db
    .select({ count: count() })
    .from(productSchema)
    .where(
      and(
        eq(productSchema.ownerId, ownerId),
        gte(productSchema.createdAt, thisWeek),
      ),
    );

  // Get this month's count
  const [monthResult] = await db
    .select({ count: count() })
    .from(productSchema)
    .where(
      and(
        eq(productSchema.ownerId, ownerId),
        gte(productSchema.createdAt, thisMonth),
      ),
    );

  // Get category breakdown
  const categoryResults = await db
    .select({
      name: productSchema.category,
      count: count(),
    })
    .from(productSchema)
    .where(eq(productSchema.ownerId, ownerId))
    .groupBy(productSchema.category)
    .orderBy(desc(count()));

  return {
    total: totalResult?.count ?? 0,
    today: todayResult?.count ?? 0,
    thisWeek: weekResult?.count ?? 0,
    thisMonth: monthResult?.count ?? 0,
    categories: categoryResults.map(cat => ({
      name: cat.name || 'Uncategorized',
      count: cat.count,
    })),
  };
}

/**
 * Check if a product exists with ownership check
 * @param id - Product ID
 * @param ownerId - Owner ID
 * @returns Promise resolving to boolean
 */
export async function productExists(id: number, ownerId: string): Promise<boolean> {
  const product = await getProductById(id, ownerId);
  return product !== null;
}

/**
 * Get paginated products with metadata
 * @param params - Query parameters
 * @returns Promise resolving to products with pagination metadata
 */
export async function getPaginatedProducts(params: ProductListParamsWithOwner): Promise<{
  products: ProductDb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  const [products, total] = await Promise.all([
    getProductsByOwner(params),
    getProductsCount(params.ownerId, params.search),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      hasMore: (page * limit) < total,
    },
  };
}
