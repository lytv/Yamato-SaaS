/**
 * ProductSubs API Client
 * Handles all HTTP requests to productsubsub endpoints
 * Following Yamato-SaaS patterns and error handling
 */

import type {
  ProductSub,
  ProductSubErrorResponse,
  ProductSubFormData,
  ProductSubListParams,
  ProductSubResponse,
  ProductSubsResponse,
  UpdateProductSubInput,
} from '@/types/productsub';

/**
 * Fetch paginated productsubsubs list
 */
export async function fetchProductSubs(
  params: ProductSubListParams,
): Promise<ProductSubsResponse | ProductSubErrorResponse> {
  const definedParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      definedParams[key] = String(value);
    }
  });

  const queryParams = new URLSearchParams(definedParams);

  try {
    const response = await fetch(`/api/productsubs?${queryParams.toString()}`);
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
 * Fetch single productsubsub by ID
 */
export async function fetchProductSub(id: number): Promise<ProductSub> {
  const response = await fetch(`/api/productsubs/${id}`);

  if (!response.ok) {
    const error: ProductSubErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch productsubsub');
  }

  const result: ProductSubResponse = await response.json();
  return result.data;
}

/**
 * Create new productsubsub
 */
export async function createProductSub(data: ProductSubFormData): Promise<ProductSub> {
  const response = await fetch('/api/productsubs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProductSubErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to create productsubsub');
  }

  const result: ProductSubResponse = await response.json();
  return result.data;
}

/**
 * Update existing productsubsub
 */
export async function updateProductSub(id: number, data: UpdateProductSubInput): Promise<ProductSub> {
  const response = await fetch(`/api/productsubs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProductSubErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to update productsubsub');
  }

  const result: ProductSubResponse = await response.json();
  return result.data;
}

/**
 * Delete productsubsub
 */
export async function deleteProductSub(id: number): Promise<void> {
  const response = await fetch(`/api/productsubs/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: ProductSubErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to delete productsubsub');
  }
}

/**
 * Import productsubs from Excel file
 */
export async function importProductSubs(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/productsubs/import', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Failed to import productsubs');
  }
  return await response.json();
}
