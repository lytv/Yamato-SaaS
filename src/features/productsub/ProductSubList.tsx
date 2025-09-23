/**
 * ProductSubList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays productsubs in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Calendar, Download, Edit, FileText, Filter, Grid3X3, Layers, List, Package, Search, Tag, Trash2, Upload } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

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
      {/* Control Panel */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* Search Section */}
          <div className="flex flex-1 items-center space-x-4">
            <div className="relative max-w-lg flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="size-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search product subs..."
                value={search}
                onChange={handleSearchInputChange}
                aria-label="Search product subs"
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm transition-all duration-200 placeholder:text-gray-500 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Show All Toggle */}
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={showAll}
                onChange={e => setShowAll(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Show All
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  viewMode === 'card'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Card View"
              >
                <Grid3X3 className="mr-1 size-4" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="List View"
              >
                <List className="mr-1 size-4" />
                List
              </button>
            </div>

            {/* Filter dropdown */}
            <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-2">
              <Filter className="size-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={handleSortFieldChange}
                className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
              >
                <option value="createdAt">Sort by Created</option>
                <option value="updatedAt">Sort by Updated</option>
                <option value="productSubName">Sort by Name</option>
                <option value="productSubCode">Sort by Code</option>
              </select>
              <button
                type="button"
                onClick={handleSortOrderToggle}
                className="text-gray-500 transition-colors hover:text-gray-700"
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>

            {/* Export button */}
            <button
              type="button"
              onClick={handleExportProductSubs}
              disabled={isExporting || productsubs.length === 0}
              className="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="mr-2 size-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>

            {/* Import button */}
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-purple-600"
            >
              <Upload className="mr-2 size-4" />
              Import
            </button>

            {/* Clear Search */}
            {search && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-gray-500 underline hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Export Error Display */}
      {exportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-700">
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

      {/* Product Subs Display */}
      {viewMode === 'card'
        ? (
      /* Card View */
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {productsubs.map((productsub) => {
                const product = products.find(p => p.id === productsub.productId);
                return (
                  <div key={productsub.id} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                    {/* Card Header */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {/* ProductSub Icon */}
                        <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500">
                          <Layers className="size-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-semibold text-gray-900">{productsub.productSubDetail}</h3>
                          <p className="truncate font-mono text-sm text-gray-500">
                            {productsub.productSubCode}
                          </p>
                        </div>
                      </div>

                      {/* Category Badge */}
                      {productsub.subCategory && (
                        <div className="inline-flex items-center rounded-full border border-purple-200 bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800">
                          <Tag className="mr-1 size-3" />
                          {productsub.subCategory}
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="mb-4 space-y-3">
                      {/* Parent Product */}
                      {product && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Package className="mr-2 size-4 text-purple-500" />
                          <span className="font-medium">Product:</span>
                          <span className="ml-1">{product.productName}</span>
                        </div>
                      )}

                      {/* Notes */}
                      {productsub.note && (
                        <div className="rounded-lg bg-gray-50 p-3">
                          <div className="flex items-start">
                            <FileText className="mr-2 mt-0.5 size-4 shrink-0 text-gray-500" />
                            <p className="line-clamp-2 text-sm text-gray-600">
                              {productsub.note}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="mr-1 size-3" />
                          Created:
                          {' '}
                          {formatDate(productsub.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-1 size-3" />
                          Updated:
                          {' '}
                          {formatDate(productsub.updatedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex justify-end space-x-2 border-t border-gray-100 pt-4">
                      <button
                        type="button"
                        onClick={() => onEdit(productsub)}
                        disabled={isDeleting}
                        className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-purple-600 transition-all duration-200 hover:bg-purple-50 hover:text-purple-800"
                      >
                        <Edit className="mr-1 size-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(productsub)}
                        disabled={isDeleting}
                        className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800"
                      >
                        <Trash2 className="mr-1 size-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        : (
      /* List View */
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              {/* List Header */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <div className="col-span-3">Product Sub</div>
                  <div className="col-span-2">Parent Product</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-3">Notes</div>
                  <div className="col-span-1">Created</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* List Items */}
              <div className="divide-y divide-gray-100">
                {productsubs.map((productsub) => {
                  const product = products.find(p => p.id === productsub.productId);
                  return (
                    <div key={productsub.id} className="px-6 py-4 transition-colors duration-150 hover:bg-gray-50">
                      <div className="grid grid-cols-12 items-center gap-4">
                        {/* Product Sub Info */}
                        <div className="col-span-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500">
                              <Layers className="size-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">{productsub.productSubDetail}</p>
                              <p className="truncate font-mono text-xs text-gray-500">{productsub.productSubCode}</p>
                            </div>
                          </div>
                        </div>

                        {/* Parent Product */}
                        <div className="col-span-2">
                          {product
                            ? (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Package className="mr-1 size-3 text-purple-500" />
                                  {product.productName}
                                </div>
                              )
                            : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                        </div>

                        {/* Category */}
                        <div className="col-span-2">
                          {productsub.subCategory
                            ? (
                                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                                  <Tag className="mr-1 size-3" />
                                  {productsub.subCategory}
                                </span>
                              )
                            : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                        </div>

                        {/* Notes */}
                        <div className="col-span-3">
                          {productsub.note
                            ? (
                                <div className="flex items-center text-sm text-gray-600">
                                  <FileText className="mr-1 size-3 text-gray-400" />
                                  <span className="truncate">{productsub.note}</span>
                                </div>
                              )
                            : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                        </div>

                        {/* Created Date */}
                        <div className="col-span-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="mr-1 size-3" />
                            {formatDate(productsub.createdAt)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1">
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => onEdit(productsub)}
                              disabled={isDeleting}
                              className="rounded p-1 text-purple-600 transition-all duration-200 hover:bg-purple-50 hover:text-purple-800"
                              title="Edit"
                            >
                              <Edit className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(productsub)}
                              disabled={isDeleting}
                              className="rounded p-1 text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

      {/* Pagination */}
      {!showAll && pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between pt-4 text-sm">
          <span>
            Showing
            {' '}
            {productsubs.length}
            {' '}
            of
            {' '}
            {pagination.total}
            {' '}
            product subs
            {pagination.page && ` • Page ${pagination.page}`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={!pagination?.hasMore}
              className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmProductSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm duration-300 animate-in fade-in">
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-300 animate-in zoom-in-95">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="size-8 text-red-600" />
              </div>

              {/* Title & Content */}
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Confirm Deletion</h3>

              {/* ProductSub preview */}
              <div className="mb-4 rounded-lg bg-gray-50 p-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500">
                    <Layers className="size-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{deleteConfirmProductSub.productSubDetail}</h4>
                    <p className="font-mono text-sm text-gray-500">{deleteConfirmProductSub.productSubCode}</p>
                    {deleteConfirmProductSub.subCategory && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                        {deleteConfirmProductSub.subCategory}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                Are you sure you want to delete this product sub? This action cannot be undone.
              </p>

              {deleteError && (
                <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">{deleteError}</div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="mr-2 size-4" />
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
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
