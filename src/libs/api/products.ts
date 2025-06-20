/**
 * Products API Client
 * Handles all HTTP requests to product endpoints
 * Following Yamato-SaaS patterns and error handling
 */

import type {
  Product,
  ProductErrorResponse,
  ProductFormData,
  ProductListParams,
  ProductResponse,
  ProductsResponse,
  UpdateProductInput,
} from '@/types/product';

/**
 * Fetch paginated products list
 */
export async function fetchProducts(
  params: ProductListParams,
): Promise<ProductsResponse | ProductErrorResponse> {
  const definedParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      definedParams[key] = String(value);
    }
  });

  const queryParams = new URLSearchParams(definedParams);

  try {
    const response = await fetch(`/api/products?${queryParams.toString()}`);
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
 * Fetch single product by ID
 */
export async function fetchProduct(id: number): Promise<Product> {
  const response = await fetch(`/api/products/${id}`);

  if (!response.ok) {
    const error: ProductErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch product');
  }

  const result: ProductResponse = await response.json();
  return result.data;
}

/**
 * Create new product
 */
export async function createProduct(data: ProductFormData): Promise<Product> {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProductErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to create product');
  }

  const result: ProductResponse = await response.json();
  return result.data;
}

/**
 * Update existing product
 */
export async function updateProduct(id: number, data: UpdateProductInput): Promise<Product> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ProductErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to update product');
  }

  const result: ProductResponse = await response.json();
  return result.data;
}

/**
 * Delete product
 */
export async function deleteProduct(id: number): Promise<void> {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error: ProductErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to delete product');
  }
}
