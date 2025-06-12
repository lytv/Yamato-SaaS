/**
 * ProductionStepDetails API Client
 * Handles all HTTP requests to production step detail endpoints
 * Following Yamato-SaaS patterns and error handling
 */

import type {
  ProductionStepDetail,
  ProductionStepDetailErrorResponse,
  ProductionStepDetailFormData,
  ProductionStepDetailListParamsWithOwner,
  ProductionStepDetailResponse,
  ProductionStepDetailsResponse,
  ProductionStepDetailStats,
  UpdateProductionStepDetailInput,
} from '@/types/productionStepDetail';

/**
 * Fetch paginated production step details list
 */
export async function fetchProductionStepDetails(params: ProductionStepDetailListParamsWithOwner): Promise<ProductionStepDetailsResponse> {
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
  if (params.ownerId) {
    searchParams.set('ownerId', params.ownerId);
  }
  if (params.productId) {
    searchParams.set('productId', params.productId.toString());
  }
  if (params.productionStepId) {
    searchParams.set('productionStepId', params.productionStepId.toString());
  }

  const response = await fetch(`/api/production-step-details?${searchParams.toString()}`);

  if (!response.ok) {
    const error: ProductionStepDetailErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch production step details');
  }

  return response.json();
}

/**
 * Fetch single production step detail by ID
 */
export async function fetchProductionStepDetail(id: number): Promise<ProductionStepDetail> {
  const response = await fetch(`/api/production-step-details/${id}`);

  if (!response.ok) {
    const error: ProductionStepDetailErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch production step detail');
  }

  const result: ProductionStepDetailResponse = await response.json();
  return result.data;
}

/**
 * Create new production step detail
 */
export async function createProductionStepDetail(data: ProductionStepDetailFormData): Promise<ProductionStepDetail> {
  const response = await fetch('/api/production-step-details', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProductionStepDetailErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to create production step detail');
  }

  const result: ProductionStepDetailResponse = await response.json();
  return result.data;
}

/**
 * Update existing production step detail
 */
export async function updateProductionStepDetail(id: number, data: UpdateProductionStepDetailInput): Promise<ProductionStepDetail> {
  const response = await fetch(`/api/production-step-details/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProductionStepDetailErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to update production step detail');
  }

  const result: ProductionStepDetailResponse = await response.json();
  return result.data;
}

/**
 * Delete production step detail
 */
export async function deleteProductionStepDetail(id: number): Promise<void> {
  const response = await fetch(`/api/production-step-details/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: ProductionStepDetailErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to delete production step detail');
  }
}

/**
 * Fetch production step detail statistics
 */
export async function fetchProductionStepDetailStats(): Promise<ProductionStepDetailStats> {
  const response = await fetch('/api/production-step-details/stats');

  if (!response.ok) {
    const error: ProductionStepDetailErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch production step detail statistics');
  }

  const result = await response.json();
  return result.data;
}
