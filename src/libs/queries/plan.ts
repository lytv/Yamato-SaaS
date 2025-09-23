/**
 * Plan database queries using Drizzle ORM
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Supporting multi-tenancy (personal vs organization plans)
 */

import { and, asc, count, desc, eq, gte, ilike, or } from 'drizzle-orm';

import { planSchema } from '@/models/Schema';
import type {
  CreatePlanInput,
  PlanDb,
  PlanListParamsWithOwner,
  PlanStats,
  UpdatePlanInput,
} from '@/types/plan';

import { db } from '../DB';

/**
 * Create a new plan
 * @param data - Plan creation data
 * @returns Promise resolving to created plan
 */
export async function createPlan(data: CreatePlanInput): Promise<PlanDb> {
  const [plan] = await db
    .insert(planSchema)
    .values({
      ownerId: data.ownerId,
      planCode: data.planCode,
      planName: data.planName,
      planYear: data.planYear,
      planMonth: data.planMonth,
      totalTargetQuantity: data.totalTargetQuantity,
      totalActualQuantity: data.totalActualQuantity,
      status: data.status,
      planStartDate: data.planStartDate ? new Date(data.planStartDate) : null,
      planEndDate: data.planEndDate ? new Date(data.planEndDate) : null,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt ? new Date(data.approvedAt) : null,
      note: data.note,
    } as any)
    .returning();

  if (!plan) {
    throw new Error('Failed to create plan');
  }

  return plan;
}

/**
 * Get plans by organization with pagination and filtering
 * Now filters by organization members instead of just owner
 * @param params - Query parameters including orgId, pagination, and filters
 * @returns Promise resolving to array of plans
 */
export async function getPlansByOwner(params: PlanListParamsWithOwner): Promise<PlanDb[]> {
  const {
    ownerId: orgId, // ownerId is now actually orgId from the route
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    showAll = false,
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions - filter by orgId instead of specific ownerId
  // This allows all org members to see all plans created by anyone in the org
  let whereConditions = eq(planSchema.ownerId, orgId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(planSchema.ownerId, orgId),
      or(
        ilike(planSchema.planCode, searchTerm),
        ilike(planSchema.planName, searchTerm),
        ilike(planSchema.status, searchTerm),
        ilike(planSchema.approvedBy, searchTerm),
        ilike(planSchema.note, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Build sort order with proper type checking
  let orderBy;
  switch (sortBy) {
    case 'createdAt':
      orderBy = sortOrder === 'asc' ? asc(planSchema.createdAt) : desc(planSchema.createdAt);
      break;
    case 'updatedAt':
      orderBy = sortOrder === 'asc' ? asc(planSchema.updatedAt) : desc(planSchema.updatedAt);
      break;
    case 'planName':
      orderBy = sortOrder === 'asc' ? asc(planSchema.planName) : desc(planSchema.planName);
      break;
    case 'planCode':
      orderBy = sortOrder === 'asc' ? asc(planSchema.planCode) : desc(planSchema.planCode);
      break;
    default:
      orderBy = desc(planSchema.createdAt);
  }

  const query = db
    .select()
    .from(planSchema)
    .where(whereConditions)
    .orderBy(orderBy);

  if (showAll) {
    return await query;
  }

  // Execute query with all conditions
  return await query.limit(limit).offset(offset);
}

/**
 * Get total count of plans for pagination
 * @param orgId - Organization ID to filter plans
 * @param search - Optional search term
 * @returns Promise resolving to total count
 */
export async function getPlansCount(orgId: string, search?: string): Promise<number> {
  // Build where conditions
  let whereConditions = eq(planSchema.ownerId, orgId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(planSchema.ownerId, orgId),
      or(
        ilike(planSchema.planCode, searchTerm),
        ilike(planSchema.planName, searchTerm),
        ilike(planSchema.status, searchTerm),
        ilike(planSchema.approvedBy, searchTerm),
        ilike(planSchema.note, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  const [result] = await db
    .select({ count: count() })
    .from(planSchema)
    .where(whereConditions);

  return result?.count ?? 0;
}

/**
 * Get a single plan by ID with ownership check
 * @param id - Plan ID
 * @param orgId - Organization ID for authorization
 * @returns Promise resolving to plan or null if not found
 */
export async function getPlanById(id: number, orgId: string): Promise<PlanDb | null> {
  const [plan] = await db
    .select()
    .from(planSchema)
    .where(
      and(
        eq(planSchema.id, id),
        eq(planSchema.ownerId, orgId),
      ),
    )
    .limit(1);

  return plan ?? null;
}

/**
 * Get a plan by planCode with ownership check (for duplicate detection)
 * @param planCode - Plan code to check
 * @param orgId - Organization ID for authorization
 * @returns Promise resolving to plan or null if not found
 */
export async function getPlanByCode(planCode: string, orgId: string): Promise<PlanDb | null> {
  const [plan] = await db
    .select()
    .from(planSchema)
    .where(
      and(
        eq(planSchema.planCode, planCode),
        eq(planSchema.ownerId, orgId),
      ),
    )
    .limit(1);

  return plan ?? null;
}

/**
 * Update a plan with ownership check
 * @param id - Plan ID
 * @param orgId - Organization ID for authorization
 * @param data - Update data
 * @returns Promise resolving to updated plan
 */
export async function updatePlan(
  id: number,
  orgId: string,
  data: UpdatePlanInput,
): Promise<PlanDb> {
  // First check if plan exists and belongs to owner
  const existingPlan = await getPlanById(id, orgId);
  if (!existingPlan) {
    throw new Error('Plan not found or access denied');
  }

  // Prepare update data with proper type handling
  const updateData: Record<string, unknown> = {
    planCode: data.planCode ?? existingPlan.planCode,
    planName: data.planName ?? existingPlan.planName,
    planYear: data.planYear ?? existingPlan.planYear,
    planMonth: data.planMonth ?? existingPlan.planMonth,
    totalTargetQuantity: data.totalTargetQuantity ?? existingPlan.totalTargetQuantity,
    totalActualQuantity: data.totalActualQuantity ?? existingPlan.totalActualQuantity,
    status: data.status ?? existingPlan.status,
    approvedBy: data.approvedBy ?? existingPlan.approvedBy,
    note: data.note ?? existingPlan.note,
    updatedAt: new Date(),
  };

  // Handle date fields with proper type conversion
  if (data.planStartDate !== undefined) {
    updateData.planStartDate = data.planStartDate ? new Date(data.planStartDate) : null;
  } else {
    updateData.planStartDate = existingPlan.planStartDate;
  }

  if (data.planEndDate !== undefined) {
    updateData.planEndDate = data.planEndDate ? new Date(data.planEndDate) : null;
  } else {
    updateData.planEndDate = existingPlan.planEndDate;
  }

  if (data.approvedAt !== undefined) {
    updateData.approvedAt = data.approvedAt ? new Date(data.approvedAt) : null;
  } else {
    updateData.approvedAt = existingPlan.approvedAt;
  }

  const [updatedPlan] = await db
    .update(planSchema)
    .set(updateData as any)
    .where(
      and(
        eq(planSchema.id, id),
        eq(planSchema.ownerId, orgId),
      ),
    )
    .returning();

  if (!updatedPlan) {
    throw new Error('Failed to update plan');
  }

  return updatedPlan;
}

/**
 * Delete a plan with ownership check
 * @param id - Plan ID
 * @param orgId - Organization ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deletePlan(id: number, orgId: string): Promise<boolean> {
  // First check if plan exists and belongs to owner
  const existingPlan = await getPlanById(id, orgId);
  if (!existingPlan) {
    throw new Error('Plan not found or access denied');
  }

  await db
    .delete(planSchema)
    .where(
      and(
        eq(planSchema.id, id),
        eq(planSchema.ownerId, orgId),
      ),
    );

  return true;
}

/**
 * Get plan statistics for dashboard
 * @param orgId - Organization ID to get stats for
 * @returns Promise resolving to plan statistics
 */
export async function getPlanStats(orgId: string): Promise<PlanStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(planSchema)
    .where(eq(planSchema.ownerId, orgId));

  // Get today's count
  const [todayResult] = await db
    .select({ count: count() })
    .from(planSchema)
    .where(
      and(
        eq(planSchema.ownerId, orgId),
        gte(planSchema.createdAt, today),
      ),
    );

  // Get this week's count
  const [weekResult] = await db
    .select({ count: count() })
    .from(planSchema)
    .where(
      and(
        eq(planSchema.ownerId, orgId),
        gte(planSchema.createdAt, thisWeek),
      ),
    );

  // Get this month's count
  const [monthResult] = await db
    .select({ count: count() })
    .from(planSchema)
    .where(
      and(
        eq(planSchema.ownerId, orgId),
        gte(planSchema.createdAt, thisMonth),
      ),
    );

  // Get status breakdown (since plan schema doesn't have category)
  const statusResults = await db
    .select({
      name: planSchema.status,
      count: count(),
    })
    .from(planSchema)
    .where(eq(planSchema.ownerId, orgId))
    .groupBy(planSchema.status)
    .orderBy(desc(count()));

  return {
    total: totalResult?.count ?? 0,
    today: todayResult?.count ?? 0,
    thisWeek: weekResult?.count ?? 0,
    thisMonth: monthResult?.count ?? 0,
    categories: statusResults.map((status: any) => ({
      name: status.name || 'No Status',
      count: status.count,
    })),
  };
}

/**
 * Check if a plan exists with ownership check
 * @param id - Plan ID
 * @param orgId - Organization ID
 * @returns Promise resolving to boolean
 */
export async function planExists(id: number, orgId: string): Promise<boolean> {
  const plan = await getPlanById(id, orgId);
  return plan !== null;
}

/**
 * Get paginated plans with metadata
 * @param params - Query parameters
 * @returns Promise resolving to plans with pagination metadata
 */
export async function getPaginatedPlans(params: PlanListParamsWithOwner): Promise<{
  plans: PlanDb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const plans = await getPlansByOwner(params);
  const total = await getPlansCount(params.ownerId, params.search);
  const { page = 1, limit = 10, showAll = false } = params;

  if (showAll) {
    return {
      plans,
      pagination: {
        page: 1,
        limit: total,
        total,
        hasMore: false,
      },
    };
  }

  return {
    plans,
    pagination: {
      page,
      limit,
      total,
      hasMore: (page * limit) < total,
    },
  };
}
