/**
 * Plans API Client
 * Handles all HTTP requests to plan endpoints
 * Following Yamato-SaaS patterns and error handling
 */

import type {
  Plan,
  PlanErrorResponse,
  PlanFormData,
  PlanListParams,
  PlanResponse,
  PlansResponse,
  UpdatePlanInput,
} from '@/types/plan';

/**
 * Fetch paginated plans list
 */
export async function fetchPlans(
  params: PlanListParams,
): Promise<PlansResponse | PlanErrorResponse> {
  const definedParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      definedParams[key] = String(value);
    }
  });

  const queryParams = new URLSearchParams(definedParams);

  try {
    const response = await fetch(`/api/plans?${queryParams.toString()}`);
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
 * Fetch single plan by ID
 */
export async function fetchPlan(id: number): Promise<Plan> {
  const response = await fetch(`/api/plans/${id}`);

  if (!response.ok) {
    const error: PlanErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch plan');
  }

  const result: PlanResponse = await response.json();
  return result.data;
}

/**
 * Create new plan
 */
export async function createPlan(data: PlanFormData): Promise<Plan> {
  const response = await fetch('/api/plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: PlanErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to create plan');
  }

  const result: PlanResponse = await response.json();
  return result.data;
}

/**
 * Update existing plan
 */
export async function updatePlan(id: number, data: UpdatePlanInput): Promise<Plan> {
  const response = await fetch(`/api/plans/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: PlanErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to update plan');
  }

  const result: PlanResponse = await response.json();
  return result.data;
}

/**
 * Delete plan
 */
export async function deletePlan(id: number): Promise<void> {
  const response = await fetch(`/api/plans/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: PlanErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to delete plan');
  }
}
