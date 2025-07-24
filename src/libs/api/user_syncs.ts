/**
 * UserSyncs API Client
 * Handles all HTTP requests to user_sync endpoints
 * Following Yamato-SaaS patterns and error handling
 */

import type {
  UpdateUserSyncInput,
  UserSync,
  UserSyncErrorResponse,
  UserSyncFormData,
  UserSyncListParams,
  UserSyncResponse,
  UserSyncsResponse,
} from '@/types/user_sync';

/**
 * Fetch paginated user_syncs list
 */
export async function fetchUserSyncs(
  params: UserSyncListParams,
): Promise<UserSyncsResponse | UserSyncErrorResponse> {
  const definedParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      definedParams[key] = String(value);
    }
  });

  const queryParams = new URLSearchParams(definedParams);

  try {
    const response = await fetch(`/api/user_syncs?${queryParams.toString()}`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Fetch single user_sync by ID
 */
export async function fetchUserSync(id: number): Promise<UserSync> {
  const response = await fetch(`/api/user_syncs/${id}`);

  if (!response.ok) {
    const error: UserSyncErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch user_sync');
  }

  const result: UserSyncResponse = await response.json();
  return result.data;
}

/**
 * Create new user_sync
 */
export async function createUserSync(data: UserSyncFormData): Promise<UserSync> {
  const response = await fetch('/api/user_syncs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: UserSyncErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to create user_sync');
  }

  const result: UserSyncResponse = await response.json();
  return result.data;
}

/**
 * Update existing user_sync
 */
export async function updateUserSync(userId: string, data: UpdateUserSyncInput): Promise<UserSync> {
  const response = await fetch(`/api/user_syncs/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: UserSyncErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to update user_sync');
  }

  const result: UserSyncResponse = await response.json();
  return result.data;
}

/**
 * Delete user_sync
 */
export async function deleteUserSync(userId: string, ownerId: string): Promise<void> {
  const response = await fetch(`/api/user_syncs/${userId}?ownerId=${encodeURIComponent(ownerId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: UserSyncErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to delete user_sync');
  }
}
