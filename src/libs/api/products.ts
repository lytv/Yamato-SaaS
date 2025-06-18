/**
 * Products API Client
 * Handles all HTTP requests to product endpoints
 * Following Yamato-SaaS patterns and error handling
 */

import type {
  Product,
  ProductErrorResponse,
  ProductFormData,
  ProductListParamsWithOwner,
  ProductResponse,
  ProductsResponse,
  UpdateProductInput,
} from '@/types/product';

/**
 * Fetch paginated products list
 */
export async function fetchProducts(params: ProductListParamsWithOwner): Promise<ProductsResponse> {
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

  const response = await fetch(`/api/products?${searchParams.toString()}`);

  if (!response.ok) {
    const error: ProductErrorResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch products');
  }

  return response.json();
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
