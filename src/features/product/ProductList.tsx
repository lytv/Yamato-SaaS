/**
 * ProductList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays products in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import React, { useState } from 'react';

import { ProductSkeleton } from '@/features/product/ProductSkeleton';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useProductMutations } from '@/hooks/useProductMutations';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/product';

type ProductListProps = {
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export function ProductList({ onEdit, onDelete }: ProductListProps): JSX.Element {
  const { userId, orgId } = useAuth();
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    search,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    resetFilters,
  } = useProductFilters();

  // Get ownerId for multi-tenancy
  const ownerId = orgId || userId || '';

  const { products, pagination, isLoading, error, refresh } = useProducts({
    search,
    sortBy,
    sortOrder,
    page: 1,
    limit: 10,
    ownerId,
  });

  const { deleteProduct, isDeleting } = useProductMutations();

  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle delete confirmation
  const handleDeleteClick = (product: Product): void => {
    setDeleteConfirmProduct(product);
    setDeleteError(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteConfirmProduct) {
      return;
    }

    try {
      await deleteProduct(deleteConfirmProduct.id);
      onDelete(deleteConfirmProduct);
      setDeleteConfirmProduct(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      setDeleteError(errorMessage);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = (): void => {
    setDeleteConfirmProduct(null);
    setDeleteError(null);
  };

  // Handle search input change
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    handleSearchChange(event.target.value);
  };

  // Handle sort field change
  const handleSortFieldChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    handleSortChange(event.target.value as any);
  };

  // Handle sort order toggle
  const handleSortOrderToggle = (): void => {
    handleSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div role="status" aria-label="Loading products" className="sr-only">
          Loading products...
        </div>
        <ProductSkeleton data-testid="product-list-skeleton" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-red-600">{error}</div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (products.length === 0 && !search) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create your first product to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="max-w-lg flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={handleSearchInputChange}
              aria-label="Search products"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 leading-5 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:placeholder:text-gray-400 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <label htmlFor="sortBy" className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={handleSortFieldChange}
              aria-label="Sort by"
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
              <option value="productName">Product Name</option>
              <option value="productCode">Product Code</option>
            </select>

            <button
              type="button"
              onClick={handleSortOrderToggle}
              aria-label="Sort order"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>

          {/* Clear Search */}
          {search && (
            <button
              type="button"
              onClick={resetFilters}
              aria-label="Clear search"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {search && (
        <div className="text-sm text-gray-600">
          Search results for "
          {search}
          "
        </div>
      )}

      {/* Product Count */}
      <div className="text-sm text-gray-600">
        Showing
        {' '}
        {products.length}
        {' '}
        of
        {' '}
        {pagination?.total || 0}
        {' '}
        products
        {pagination?.page && (
          <span>
            {' '}
            • Page
            {pagination.page}
          </span>
        )}
      </div>

      {/* Products Table */}
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <table role="table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Product Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {product.productCode}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {product.productName}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {product.category || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(product.createdAt)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(product.updatedAt)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      disabled={isDeleting}
                      className="text-indigo-600 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(product)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load More Button */}
      {pagination?.hasMore && (
        <div className="text-center">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Load more
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 size-full overflow-y-auto bg-gray-600/50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirm deletion</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "
                  {deleteConfirmProduct.productName}
                  "? This action cannot be undone.
                </p>
                {deleteError && (
                  <div className="mt-2 text-sm text-red-600">{deleteError}</div>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={handleDeleteCancel}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-500 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
