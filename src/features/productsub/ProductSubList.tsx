/**
 * ProductSubList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays productsubs in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download, Upload, Search, Filter, Layers, Edit, Trash2, Calendar, Tag, FileText, Grid3X3, List, Package } from 'lucide-react';
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
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* Search Section */}
          <div className="flex flex-1 items-center space-x-4">
            <div className="relative max-w-lg flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search product subs..."
                value={search}
                onChange={handleSearchInputChange}
                aria-label="Search product subs"
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder:text-gray-500 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              />
            </div>
            
            {/* Show All Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={showAll}
                onChange={e => setShowAll(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Show All
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'card'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Card View"
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="List View"
              >
                <List className="h-4 w-4 mr-1" />
                List
              </button>
            </div>

            {/* Filter dropdown */}
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={handleSortFieldChange}
                className="bg-transparent border-0 text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
              >
                <option value="createdAt">Sort by Created</option>
                <option value="updatedAt">Sort by Updated</option>
                <option value="productSubName">Sort by Name</option>
                <option value="productSubCode">Sort by Code</option>
              </select>
              <button
                type="button"
                onClick={handleSortOrderToggle}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>

            {/* Export button */}
            <button
              type="button"
              onClick={handleExportProductSubs}
              disabled={isExporting || productsubs.length === 0}
              className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>

            {/* Import button */}
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-all duration-200 transform hover:scale-105"
            >
              <Upload className="mr-2 h-4 w-4" />
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
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="text-sm text-red-700">
            Export failed: {exportError}
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
          Search results for "{search}"
        </div>
      )}

      {/* Product Subs Display */}
      {viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {productsubs.map(productsub => {
            const product = products.find(p => p.id === productsub.productId);
            return (
              <div key={productsub.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {/* ProductSub Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                      <Layers className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{productsub.productSubDetail}</h3>
                      <p className="text-sm text-gray-500 truncate font-mono">
                        {productsub.productSubCode}
                      </p>
                    </div>
                  </div>
                  
                  {/* Category Badge */}
                  {productsub.subCategory && (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      <Tag className="w-3 h-3 mr-1" />
                      {productsub.subCategory}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="space-y-3 mb-4">
                  {/* Parent Product */}
                  {product && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="w-4 h-4 mr-2 text-purple-500" />
                      <span className="font-medium">Product:</span>
                      <span className="ml-1">{product.productName}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {productsub.note && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start">
                        <FileText className="w-4 h-4 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {productsub.note}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Created: {formatDate(productsub.createdAt)}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Updated: {formatDate(productsub.updatedAt)}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => onEdit(productsub)}
                    disabled={isDeleting}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(productsub)}
                    disabled={isDeleting}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* List Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
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
            {productsubs.map(productsub => {
              const product = products.find(p => p.id === productsub.productId);
              return (
                <div key={productsub.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Product Sub Info */}
                    <div className="col-span-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Layers className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{productsub.productSubDetail}</p>
                          <p className="text-xs text-gray-500 font-mono truncate">{productsub.productSubCode}</p>
                        </div>
                      </div>
                    </div>

                    {/* Parent Product */}
                    <div className="col-span-2">
                      {product ? (
                        <div className="flex items-center text-sm text-gray-600">
                          <Package className="w-3 h-3 mr-1 text-purple-500" />
                          {product.productName}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      {productsub.subCategory ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Tag className="w-3 h-3 mr-1" />
                          {productsub.subCategory}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="col-span-3">
                      {productsub.note ? (
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="w-3 h-3 mr-1 text-gray-400" />
                          <span className="truncate">{productsub.note}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>

                    {/* Created Date */}
                    <div className="col-span-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
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
                          className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-all duration-200"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(productsub)}
                          disabled={isDeleting}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
            Showing {productsubs.length} of {pagination.total} product subs
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative mx-4 w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              
              {/* Title & Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
              
              {/* ProductSub preview */}
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{deleteConfirmProductSub.productSubDetail}</h4>
                    <p className="text-sm text-gray-500 font-mono">{deleteConfirmProductSub.productSubCode}</p>
                    {deleteConfirmProductSub.subCategory && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                        {deleteConfirmProductSub.subCategory}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this product sub? This action cannot be undone.
              </p>

              {deleteError && (
                <div className="mt-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">{deleteError}</div>
              )}
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
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
