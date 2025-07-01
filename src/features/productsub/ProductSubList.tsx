/**
 * ProductSubList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays productsubs in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download, Upload } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { ProductSubSkeleton } from '@/features/productsub/ProductSubSkeleton';
import { useProductSubExport } from '@/hooks/useProductSubExport';
import { useProductSubFilters } from '@/hooks/useProductSubFilters';
import { useProductSubMutations } from '@/hooks/useProductSubMutations';
import { useProductSubs } from '@/hooks/useProductSubs';
import { fetchProducts } from '@/libs/api/products';
import type { ImportResult } from '@/types/import';
import type { Product } from '@/types/product';
import type { ProductSub } from '@/types/productsub';

import { ProductSubImportModal } from './ProductSubImportModal';

type ProductSubListProps = {
  onEdit: (productsub: ProductSub) => void;
  onDelete: (productsub: ProductSub) => void;
};

export function ProductSubList({ onEdit, onDelete }: ProductSubListProps): JSX.Element {
  const { userId, orgId } = useAuth();
  const [deleteConfirmProductSub, setDeleteConfirmProductSub] = useState<ProductSub | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const {
    search,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    resetFilters,
  } = useProductSubFilters();

  // Get ownerId for multi-tenancy
  const ownerId = orgId || userId || '';

  const { productsubs, pagination, isLoading, error, refresh } = useProductSubs({
    search,
    sortBy,
    sortOrder,
    page: showAll ? 1 : page,
    limit: 10,
    ownerId,
    showAll,
  });

  const { deleteProductSub, isDeleting } = useProductSubMutations();
  const { exportProductSubs, isExporting, exportError, clearError } = useProductSubExport();

  useEffect(() => {
    fetchProducts({ page: 1, limit: 1000 }).then((res) => {
      if (res.success) {
        setProducts([...res.data]);
      }
    });
  }, []);

  // Handle import success
  const handleImportSuccess = (_result: ImportResult) => {
    // Refresh productsub list
    refresh();

    // The modal will show the success/error details,
    // so we don't need additional user notification here
  };

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
  const handleDeleteClick = (productsub: ProductSub): void => {
    setDeleteConfirmProductSub(productsub);
    setDeleteError(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteConfirmProductSub) {
      return;
    }

    try {
      await deleteProductSub(deleteConfirmProductSub.id);
      onDelete(deleteConfirmProductSub);
      setDeleteConfirmProductSub(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete productsub';
      setDeleteError(errorMessage);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = (): void => {
    setDeleteConfirmProductSub(null);
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

  // Handle export productsubs
  const handleExportProductSubs = async (): Promise<void> => {
    try {
      await exportProductSubs({
        search,
        sortBy,
        sortOrder,
      });
      clearError(); // Clear any previous errors
    } catch (err) {
      // Error is already handled in the hook
      console.error('Export failed:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div role="status" aria-label="Loading productsubs" className="sr-only">
          Loading productsubs...
        </div>
        <ProductSubSkeleton data-testid="productsub-list-skeleton" />
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
  if (productsubs.length === 0 && !search) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No productsubs found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create your first productsub to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-1 items-center space-x-4">
          <div className="relative max-w-lg flex-1">
            <input
              type="text"
              placeholder="Search productsubs..."
              value={search}
              onChange={handleSearchInputChange}
              aria-label="Search productsubs"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 leading-5 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:placeholder:text-gray-400 sm:text-sm"
            />
          </div>
          <div className="flex items-center space-x-2 pt-5">
            <input
              type="checkbox"
              id="showAll"
              checked={showAll}
              onChange={e => setShowAll(e.target.checked)}
              className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="showAll" className="text-sm font-medium text-gray-700">
              Show All
            </label>
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
              <option value="productSubName">ProductSub Name</option>
              <option value="productSubCode">ProductSub Code</option>
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

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportProductSubs}
            disabled={isExporting || productsubs.length === 0}
            aria-label="Export productsubs to Excel"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="mr-2 size-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            aria-label="Import productsubs from Excel"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Upload className="mr-2 size-4" />
            Import
          </button>

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

      {/* Export Error Display */}
      {exportError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">
            Export failed:
            {' '}
            {exportError}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {search && (
        <div className="text-sm text-gray-600">
          Search results for "
          {search}
          "
        </div>
      )}

      {/* ProductSub Count */}
      <div className="text-sm text-gray-600">
        Showing
        {' '}
        {productsubs.length}
        {' '}
        of
        {' '}
        {pagination?.total || 0}
        {' '}
        productsubs
        {pagination?.page && (
          <span>
            {' '}
            • Page
            {pagination.page}
          </span>
        )}
      </div>

      {/* ProductSubs Table */}
      <div className="overflow-x-auto">
        <table role="table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ProductSub Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {productsubs.map((productsub) => {
              const product = products.find(p => p.id === productsub.productId);
              return (
                <tr key={productsub.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{product ? product.productName : ''}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{productsub.productSubDetail}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{productsub.subCategory}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(productsub.createdAt)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(productsub.updatedAt)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => onEdit(productsub)}
                        disabled={isDeleting}
                        className="text-indigo-600 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(productsub)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!showAll && pagination && pagination.total > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing
              {' '}
              {productsubs.length}
              {' '}
              of
              {' '}
              {pagination.total}
              {' '}
              productsubs
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={!pagination?.hasMore}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmProductSub && (
        <div className="fixed inset-0 z-50 size-full overflow-y-auto bg-gray-600/50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirm deletion</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "
                  {deleteConfirmProductSub.productSubDetail}
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

      {/* Import Modal */}
      <ProductSubImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
