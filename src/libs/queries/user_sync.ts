/**
 * UserSync database queries using Drizzle ORM
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Supporting multi-tenancy (personal vs organization user_syncs)
 */

import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';

import { userSyncSchema } from '@/models/Schema';
import type {
  CreateUserSyncInput,
  UpdateUserSyncInput,
  UserSyncDb,
  UserSyncListParamsWithOwner,
  UserSyncStats,
} from '@/types/user_sync';

import { db } from '../DB';

/**
 * Create a new user_sync
 * @param data - UserSync creation data
 * @returns Promise resolving to created user_sync
 */
export async function createUserSync(data: CreateUserSyncInput): Promise<UserSyncDb> {
  const [user_sync] = await db
    .insert(userSyncSchema)
    .values({
      userId: data.userId,
      ownerId: data.ownerId,
      email: data.email,
      fullName: data.fullName,
      avatarUrl: data.avatarUrl,
      role: data.role,
      organizationRole: data.organizationRole,
      shortcut: data.shortcut,
      isActive: data.isActive,
    })
    .returning();

  if (!user_sync) {
    throw new Error('Failed to create user_sync');
  }

  return user_sync;
}

/**
 * Get user_syncs by owner with pagination and filtering
 * @param params - Query parameters including ownerId, pagination, and filters
 * @returns Promise resolving to array of user_syncs
 */
export async function getUserSyncsByOwner(params: UserSyncListParamsWithOwner): Promise<UserSyncDb[]> {
  const {
    ownerId,
    page = 1,
    limit = 10,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    showAll = false,
    shortcut,
    fullName,
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [eq(userSyncSchema.ownerId, ownerId)];

  // Add exact filter for shortcut if provided
  if (shortcut && shortcut.trim() !== '') {
    conditions.push(eq(userSyncSchema.shortcut, shortcut.trim()));
  }

  // Add exact filter for fullName if provided
  if (fullName && fullName.trim() !== '') {
    conditions.push(eq(userSyncSchema.fullName, fullName.trim()));
  }

  // Add search filter if provided (for general search)
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(userSyncSchema.email, searchTerm),
        ilike(userSyncSchema.fullName, searchTerm),
        ilike(userSyncSchema.role, searchTerm),
        ilike(userSyncSchema.organizationRole, searchTerm),
      ) as any,
    );
  }

  const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

  // Build sort order
  const validSortFields = ['userId', 'email', 'fullName', 'role', 'organizationRole', 'createdAt', 'updatedAt'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortColumn = (userSyncSchema[sortField as keyof typeof userSyncSchema] ?? userSyncSchema.createdAt) as any;
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  const query = db
    .select()
    .from(userSyncSchema)
    .where(whereConditions)
    .orderBy(orderBy);

  if (showAll) {
    return await query;
  }

  // Execute query with all conditions
  return await query.limit(limit).offset(offset);
}

/**
 * Get total count of user_syncs for pagination
 * @param ownerId - Owner ID (userId or organizationId)
 * @param search - Optional search term
 * @returns Promise resolving to total count
 */
export async function getUserSyncsCount(ownerId: string, search?: string, shortcut?: string, fullName?: string): Promise<number> {
  // Build where conditions
  const conditions = [eq(userSyncSchema.ownerId, ownerId)];

  // Add exact filter for shortcut if provided
  if (shortcut && shortcut.trim() !== '') {
    conditions.push(eq(userSyncSchema.shortcut, shortcut.trim()));
  }

  // Add exact filter for fullName if provided
  if (fullName && fullName.trim() !== '') {
    conditions.push(eq(userSyncSchema.fullName, fullName.trim()));
  }

  // Add search filter if provided (for general search)
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(userSyncSchema.email, searchTerm),
        ilike(userSyncSchema.fullName, searchTerm),
        ilike(userSyncSchema.role, searchTerm),
        ilike(userSyncSchema.organizationRole, searchTerm),
      ) as any,
    );
  }

  const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [result] = await db
    .select({ count: count() })
    .from(userSyncSchema)
    .where(whereConditions);

  return result?.count ?? 0;
}

/**
 * Get a single user_sync by userId with ownership check
 * @param userId - UserSync userId
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to user_sync or null if not found
 */
export async function getUserSyncByUserId(userId: string, ownerId: string): Promise<UserSyncDb | null> {
  const [user_sync] = await db
    .select()
    .from(userSyncSchema)
    .where(
      and(
        eq(userSyncSchema.userId, userId),
        eq(userSyncSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return user_sync ?? null;
}

/**
 * Update a user_sync with ownership check
 * @param userId - UserSync userId
 * @param ownerId - Owner ID for authorization
 * @param data - Update data
 * @returns Promise resolving to updated user_sync
 */
export async function updateUserSync(
  userId: string,
  ownerId: string,
  data: UpdateUserSyncInput,
): Promise<UserSyncDb> {
  // First check if user_sync exists and belongs to owner
  const existingUserSync = await getUserSyncByUserId(userId, ownerId);
  if (!existingUserSync) {
    throw new Error('UserSync not found or access denied');
  }

  const [updatedUserSync] = await db
    .update(userSyncSchema)
    .set({
      email: data.email ?? existingUserSync.email,
      fullName: data.fullName ?? existingUserSync.fullName,
      avatarUrl: data.avatarUrl ?? existingUserSync.avatarUrl,
      role: data.role ?? existingUserSync.role,
      organizationRole: data.organizationRole ?? existingUserSync.organizationRole,
      shortcut: data.shortcut ?? existingUserSync.shortcut,
      isActive: data.isActive ?? existingUserSync.isActive,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userSyncSchema.userId, userId),
        eq(userSyncSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedUserSync) {
    throw new Error('Failed to update user_sync');
  }

  return updatedUserSync;
}

/**
 * Delete a user_sync with ownership check
 * @param userId - UserSync userId
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to true if deleted
 */
export async function deleteUserSync(userId: string, ownerId: string): Promise<boolean> {
  const result = await db
    .delete(userSyncSchema)
    .where(
      and(
        eq(userSyncSchema.userId, userId),
        eq(userSyncSchema.ownerId, ownerId),
      ),
    );
  return Array.isArray(result) ? result.length > 0 : !!result;
}

/**
 * Get paginated user_syncs with stats
 */
export async function getPaginatedUserSyncs(params: UserSyncListParamsWithOwner): Promise<{
  user_syncs: UserSyncDb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const { ownerId, page = 1, limit = 10, search, shortcut, fullName } = params;
  const user_syncs = await getUserSyncsByOwner(params);
  const total = await getUserSyncsCount(ownerId, search, shortcut, fullName);
  return {
    user_syncs,
    pagination: {
      page,
      limit,
      total,
      hasMore: page * limit < total,
    },
  };
}

/**
 * Get user_sync statistics for dashboard
 */
export async function getUserSyncStats(ownerId: string): Promise<UserSyncStats> {
  const total = await getUserSyncsCount(ownerId);
  // Example: count by role
  const rolesRaw = await db
    .select({ name: userSyncSchema.role, count: count() })
    .from(userSyncSchema)
    .where(eq(userSyncSchema.ownerId, ownerId))
    .groupBy(userSyncSchema.role);
  const roles = rolesRaw.map((r: { name: string | null; count: number }) => ({ name: r.name ?? '', count: r.count }));
  // Example: count by createdAt (today, thisWeek, thisMonth)
  // ...
  return {
    total,
    today: 0, // implement if needed
    thisWeek: 0,
    thisMonth: 0,
    roles,
  };
}
