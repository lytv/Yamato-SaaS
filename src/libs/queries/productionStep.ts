/**
 * ProductionStep database queries using Drizzle ORM
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Supporting multi-tenancy (personal vs organization production steps)
 */

import { and, asc, count, desc, eq, gte, ilike, or } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { productionStepSchema } from '@/models/Schema';
import type {
  CreateProductionStepInput,
  ProductionStepDb,
  ProductionStepListParamsWithOwner,
  ProductionStepStats,
  UpdateProductionStepInput,
} from '@/types/productionStep';

/**
 * Create a new production step
 * @param data - ProductionStep creation data
 * @returns Promise resolving to created production step
 */
export async function createProductionStep(data: CreateProductionStepInput): Promise<ProductionStepDb> {
  const [productionStep] = await db
    .insert(productionStepSchema)
    .values({
      ownerId: data.ownerId,
      stepCode: data.stepCode,
      stepName: data.stepName,
      filmSequence: data.filmSequence,
      stepGroup: data.stepGroup,
      notes: data.notes,
    })
    .returning();

  if (!productionStep) {
    throw new Error('Failed to create production step');
  }

  return productionStep;
}

/**
 * Get production steps by owner with pagination and filtering
 * @param params - Query parameters including ownerId, pagination, and filters
 * @returns Promise resolving to array of production steps
 */
export async function getProductionStepsByOwner(params: ProductionStepListParamsWithOwner): Promise<ProductionStepDb[]> {
  const { ownerId, page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(productionStepSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(productionStepSchema.ownerId, ownerId),
      or(
        ilike(productionStepSchema.stepName, searchTerm),
        ilike(productionStepSchema.stepCode, searchTerm),
        ilike(productionStepSchema.stepGroup, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Build sort order
  const sortColumn = productionStepSchema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  // Execute query with all conditions
  return await db
    .select()
    .from(productionStepSchema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

/**
 * Get total count of production steps for pagination
 * @param ownerId - Owner ID (userId or organizationId)
 * @param search - Optional search term
 * @returns Promise resolving to total count
 */
export async function getProductionStepsCount(ownerId: string, search?: string): Promise<number> {
  // Build where conditions
  let whereConditions = eq(productionStepSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(productionStepSchema.ownerId, ownerId),
      or(
        ilike(productionStepSchema.stepName, searchTerm),
        ilike(productionStepSchema.stepCode, searchTerm),
        ilike(productionStepSchema.stepGroup, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  const [result] = await db
    .select({ count: count() })
    .from(productionStepSchema)
    .where(whereConditions);

  return result?.count ?? 0;
}

/**
 * Get a single production step by ID with ownership check
 * @param id - ProductionStep ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to production step or null if not found
 */
export async function getProductionStepById(id: number, ownerId: string): Promise<ProductionStepDb | null> {
  const [productionStep] = await db
    .select()
    .from(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.id, id),
        eq(productionStepSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return productionStep ?? null;
}

/**
 * Get a production step by stepCode with ownership check (for duplicate detection)
 * @param stepCode - Step code to check
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to production step or null if not found
 */
export async function getProductionStepByCode(stepCode: string, ownerId: string): Promise<ProductionStepDb | null> {
  const [productionStep] = await db
    .select()
    .from(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.stepCode, stepCode),
        eq(productionStepSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return productionStep ?? null;
}

/**
 * Update a production step with ownership check
 * @param id - ProductionStep ID
 * @param ownerId - Owner ID for authorization
 * @param data - Update data
 * @returns Promise resolving to updated production step
 */
export async function updateProductionStep(
  id: number,
  ownerId: string,
  data: UpdateProductionStepInput,
): Promise<ProductionStepDb> {
  // First check if production step exists and belongs to owner
  const existingStep = await getProductionStepById(id, ownerId);
  if (!existingStep) {
    throw new Error('Production step not found or access denied');
  }

  const [updatedStep] = await db
    .update(productionStepSchema)
    .set({
      stepCode: data.stepCode ?? existingStep.stepCode,
      stepName: data.stepName ?? existingStep.stepName,
      filmSequence: data.filmSequence ?? existingStep.filmSequence,
      stepGroup: data.stepGroup ?? existingStep.stepGroup,
      notes: data.notes ?? existingStep.notes,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(productionStepSchema.id, id),
        eq(productionStepSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedStep) {
    throw new Error('Failed to update production step');
  }

  return updatedStep;
}

/**
 * Delete a production step with ownership check
 * @param id - ProductionStep ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteProductionStep(id: number, ownerId: string): Promise<boolean> {
  // First check if production step exists and belongs to owner
  const existingStep = await getProductionStepById(id, ownerId);
  if (!existingStep) {
    throw new Error('Production step not found or access denied');
  }

  await db
    .delete(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.id, id),
        eq(productionStepSchema.ownerId, ownerId),
      ),
    );

  return true;
}

/**
 * Get production step statistics for dashboard
 * @param ownerId - Owner ID to get stats for
 * @returns Promise resolving to production step statistics
 */
export async function getProductionStepStats(ownerId: string): Promise<ProductionStepStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(productionStepSchema)
    .where(eq(productionStepSchema.ownerId, ownerId));

  // Get today's count
  const [todayResult] = await db
    .select({ count: count() })
    .from(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.ownerId, ownerId),
        gte(productionStepSchema.createdAt, today),
      ),
    );

  // Get this week's count
  const [weekResult] = await db
    .select({ count: count() })
    .from(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.ownerId, ownerId),
        gte(productionStepSchema.createdAt, thisWeek),
      ),
    );

  // Get this month's count
  const [monthResult] = await db
    .select({ count: count() })
    .from(productionStepSchema)
    .where(
      and(
        eq(productionStepSchema.ownerId, ownerId),
        gte(productionStepSchema.createdAt, thisMonth),
      ),
    );

  // Get step group breakdown
  const stepGroupResults = await db
    .select({
      name: productionStepSchema.stepGroup,
      count: count(),
    })
    .from(productionStepSchema)
    .where(eq(productionStepSchema.ownerId, ownerId))
    .groupBy(productionStepSchema.stepGroup)
    .orderBy(desc(count()));

  return {
    total: totalResult?.count ?? 0,
    today: todayResult?.count ?? 0,
    thisWeek: weekResult?.count ?? 0,
    thisMonth: monthResult?.count ?? 0,
    stepGroups: stepGroupResults.map(group => ({
      name: group.name || 'Uncategorized',
      count: group.count,
    })),
  };
}

/**
 * Check if a production step exists with ownership check
 * @param id - ProductionStep ID
 * @param ownerId - Owner ID
 * @returns Promise resolving to boolean
 */
export async function productionStepExists(id: number, ownerId: string): Promise<boolean> {
  const step = await getProductionStepById(id, ownerId);
  return step !== null;
}

/**
 * Get paginated production steps with metadata
 * @param params - Query parameters
 * @returns Promise resolving to production steps with pagination metadata
 */
export async function getPaginatedProductionSteps(params: ProductionStepListParamsWithOwner): Promise<{
  productionSteps: ProductionStepDb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  const [productionSteps, total] = await Promise.all([
    getProductionStepsByOwner(params),
    getProductionStepsCount(params.ownerId, params.search),
  ]);

  return {
    productionSteps,
    pagination: {
      page,
      limit,
      total,
      hasMore: (page * limit) < total,
    },
  };
}
