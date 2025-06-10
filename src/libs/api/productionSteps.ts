/**
 * Production Steps API Client
 * Handles all HTTP requests to production step endpoints
 * Following Yamato-SaaS patterns and error handling
 */

import type {
  ProductionStep,
  ProductionStepErrorResponse,
  ProductionStepFormData,
  ProductionStepListParamsWithOwner,
  ProductionStepResponse,
  ProductionStepsResponse,
  ProductionStepStats,
  ProductionStepStatsResponse,
  UpdateProductionStepInput,
} from '@/types/productionStep';

/**
 * Fetch paginated production steps list
 */
export async function fetchProductionSteps(params: ProductionStepListParamsWithOwner): Promise<ProductionStepsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', params.page.toString());
  }
  if (params.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params.search) {
    searchParams.set('search', params.search);
  }
  if (params.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }
  if (params.sortOrder) {
    searchParams.set('sortOrder', params.sortOrder);
  }
  // Note: ownerId is handled by auth in API route, not sent as query param

  const response = await fetch(`/api/production-steps?${searchParams.toString()}`);

  if (!response.ok) {
    const error: ProductionStepErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch production steps');
  }

  return response.json();
}

/**
 * Fetch single production step by ID
 */
export async function fetchProductionStep(id: number): Promise<ProductionStep> {
  const response = await fetch(`/api/production-steps/${id}`);

  if (!response.ok) {
    const error: ProductionStepErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch production step');
  }

  const result: ProductionStepResponse = await response.json();
  return result.data;
}

/**
 * Create new production step
 */
export async function createProductionStep(data: ProductionStepFormData): Promise<ProductionStep> {
  const response = await fetch('/api/production-steps', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProductionStepErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to create production step');
  }

  const result: ProductionStepResponse = await response.json();
  return result.data;
}

/**
 * Update existing production step
 */
export async function updateProductionStep(id: number, data: UpdateProductionStepInput): Promise<ProductionStep> {
  const response = await fetch(`/api/production-steps/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProductionStepErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to update production step');
  }

  const result: ProductionStepResponse = await response.json();
  return result.data;
}

/**
 * Delete production step
 */
export async function deleteProductionStep(id: number): Promise<void> {
  const response = await fetch(`/api/production-steps/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: ProductionStepErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to delete production step');
  }
}

/**
 * Fetch production step statistics
 */
export async function fetchProductionStepStats(): Promise<ProductionStepStats> {
  const response = await fetch('/api/production-steps/stats');

  if (!response.ok) {
    const error: ProductionStepErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch production step statistics');
  }

  const result: ProductionStepStatsResponse = await response.json();
  return result.data;
}
