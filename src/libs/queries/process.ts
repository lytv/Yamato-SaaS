/**
 * Process database queries using Drizzle ORM
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Supporting multi-tenancy (personal vs organization processs)
 */

import { and, asc, count, desc, eq, gte, ilike, or } from 'drizzle-orm';

import { db } from '../DB';
import { processSchema } from '@/models/Schema';
import type {
  CreateProcessInput,
  ProcessDb,
  ProcessListParamsWithOwner,
  ProcessStats,
  UpdateProcessInput,
} from '@/types/process';

/**
 * Create a new process
 * @param data - Process creation data
 * @returns Promise resolving to created process
 */
export async function createProcess(data: CreateProcessInput): Promise<ProcessDb> {
  const [process] = await db
    .insert(processSchema)
    .values({
      ownerId: data.ownerId,
      processCode: data.processCode,
      processName: data.processName,
      processCategory: data.processCategory,
      description: data.description,
    })
    .returning();

  if (!process) {
    throw new Error('Failed to create process');
  }

  return process;
}

/**
 * Get processs by owner with pagination and filtering
 * @param params - Query parameters including ownerId, pagination, and filters
 * @returns Promise resolving to array of processs
 */
export async function getProcesssByOwner(params: ProcessListParamsWithOwner): Promise<ProcessDb[]> {
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
  let whereConditions = eq(processSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(processSchema.ownerId, ownerId),
      or(
        ilike(processSchema.processName, searchTerm),
        ilike(processSchema.processCode, searchTerm),
        ilike(processSchema.processCategory, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Build sort order
  const sortColumn = processSchema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  const query = db
    .select()
    .from(processSchema)
    .where(whereConditions)
    .orderBy(orderBy);

  if (showAll) {
    return await query;
  }

  // Execute query with all conditions
  return await query.limit(limit).offset(offset);
}

/**
 * Get total count of processs for pagination
 * @param ownerId - Owner ID (userId or organizationId)
 * @param search - Optional search term
 * @returns Promise resolving to total count
 */
export async function getProcesssCount(ownerId: string, search?: string): Promise<number> {
  // Build where conditions
  let whereConditions = eq(processSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(processSchema.ownerId, ownerId),
      or(
        ilike(processSchema.processName, searchTerm),
        ilike(processSchema.processCode, searchTerm),
        ilike(processSchema.processCategory, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  const [result] = await db
    .select({ count: count() })
    .from(processSchema)
    .where(whereConditions);

  return result?.count ?? 0;
}

/**
 * Get a single process by ID with ownership check
 * @param id - Process ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to process or null if not found
 */
export async function getProcessById(id: number, ownerId: string): Promise<ProcessDb | null> {
  const [process] = await db
    .select()
    .from(processSchema)
    .where(
      and(
        eq(processSchema.id, id),
        eq(processSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return process ?? null;
}

/**
 * Get a process by processCode with ownership check (for duplicate detection)
 * @param processCode - Process code to check
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to process or null if not found
 */
export async function getProcessByCode(processCode: string, ownerId: string): Promise<ProcessDb | null> {
  const [process] = await db
    .select()
    .from(processSchema)
    .where(
      and(
        eq(processSchema.processCode, processCode),
        eq(processSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return process ?? null;
}

/**
 * Update a process with ownership check
 * @param id - Process ID
 * @param ownerId - Owner ID for authorization
 * @param data - Update data
 * @returns Promise resolving to updated process
 */
export async function updateProcess(
  id: number,
  ownerId: string,
  data: UpdateProcessInput,
): Promise<ProcessDb> {
  // First check if process exists and belongs to owner
  const existingProcess = await getProcessById(id, ownerId);
  if (!existingProcess) {
    throw new Error('Process not found or access denied');
  }

  const [updatedProcess] = await db
    .update(processSchema)
    .set({
      processCode: data.processCode ?? existingProcess.processCode,
      processName: data.processName ?? existingProcess.processName,
      processCategory: data.processCategory ?? existingProcess.processCategory,
      description: data.description ?? existingProcess.description,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(processSchema.id, id),
        eq(processSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedProcess) {
    throw new Error('Failed to update process');
  }

  return updatedProcess;
}

/**
 * Delete a process with ownership check
 * @param id - Process ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteProcess(id: number, ownerId: string): Promise<boolean> {
  // First check if process exists and belongs to owner
  const existingProcess = await getProcessById(id, ownerId);
  if (!existingProcess) {
    throw new Error('Process not found or access denied');
  }

  await db
    .delete(processSchema)
    .where(
      and(
        eq(processSchema.id, id),
        eq(processSchema.ownerId, ownerId),
      ),
    );

  return true;
}

/**
 * Get process statistics for dashboard
 * @param ownerId - Owner ID to get stats for
 * @returns Promise resolving to process statistics
 */
export async function getProcessStats(ownerId: string): Promise<ProcessStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(processSchema)
    .where(eq(processSchema.ownerId, ownerId));

  // Get today's count
  const [todayResult] = await db
    .select({ count: count() })
    .from(processSchema)
    .where(
      and(
        eq(processSchema.ownerId, ownerId),
        gte(processSchema.createdAt, today),
      ),
    );

  // Get this week's count
  const [weekResult] = await db
    .select({ count: count() })
    .from(processSchema)
    .where(
      and(
        eq(processSchema.ownerId, ownerId),
        gte(processSchema.createdAt, thisWeek),
      ),
    );

  // Get this month's count
  const [monthResult] = await db
    .select({ count: count() })
    .from(processSchema)
    .where(
      and(
        eq(processSchema.ownerId, ownerId),
        gte(processSchema.createdAt, thisMonth),
      ),
    );

  // Get processCategory breakdown
  const categoryResults = await db
    .select({ name: processSchema.processCategory, count: count() })
    .from(processSchema)
    .where(eq(processSchema.ownerId, ownerId))
    .groupBy(processSchema.processCategory)
    .orderBy(desc(count()));

  return {
    total: totalResult?.count ?? 0,
    today: todayResult?.count ?? 0,
    thisWeek: weekResult?.count ?? 0,
    thisMonth: monthResult?.count ?? 0,
    categories: categoryResults.map((cat: any) => ({
      name: cat.name || 'Uncategorized',
      count: cat.count,
    })),
  };
}

/**
 * Check if a process exists with ownership check
 * @param id - Process ID
 * @param ownerId - Owner ID
 * @returns Promise resolving to boolean
 */
export async function processExists(id: number, ownerId: string): Promise<boolean> {
  const process = await getProcessById(id, ownerId);
  return process !== null;
}

/**
 * Get paginated processs with metadata
 * @param params - Query parameters
 * @returns Promise resolving to processs with pagination metadata
 */
export async function getPaginatedProcesss(params: ProcessListParamsWithOwner): Promise<{
  processs: ProcessDb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const processs = await getProcesssByOwner(params);
  const total = await getProcesssCount(params.ownerId, params.search);
  const { page = 1, limit = 10, showAll = false } = params;

  if (showAll) {
    return {
      processs,
      pagination: {
        page: 1,
        limit: total,
        total,
        hasMore: false,
      },
    };
  }

  return {
    processs,
    pagination: {
      page,
      limit,
      total,
      hasMore: (page * limit) < total,
    },
  };
}
