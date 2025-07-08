/**
 * ProductList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays products in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

import { ProductSkeleton } from '@/features/product/ProductSkeleton';
import { useProductExport } from '@/hooks/useProductExport';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useProductMutations } from '@/hooks/useProductMutations';
import { useProducts } from '@/hooks/useProducts';
import type { ImportResult } from '@/types/import';
import type { Product } from '@/types/product';

import { ProductImportModal } from './ProductImportModal';

type ProductListProps = {
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export function ProductList({ onEdit, onDelete }: ProductListProps): JSX.Element {
  const { userId, orgId } = useAuth();
  const t = useTranslations('product.list');
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

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
    page: showAll ? 1 : page,
    limit: 10,
    ownerId,
    showAll,
  });

  const { deleteProduct, isDeleting } = useProductMutations();
  const { exportProducts, isExporting, exportError, clearError } = useProductExport();

  // Handle import success
  const handleImportSuccess = (_result: ImportResult) => {
    // Refresh product list
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

  // Handle export products
  const handleExportProducts = async (): Promise<void> => {
    try {
      await exportProducts({
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
        <div role="status" aria-label={t('loading')} className="sr-only">
          {t('loading')}
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
          {t('retry')}
        </button>
      </div>
    );
  }

  // Empty state
  if (products.length === 0 && !search) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('empty_title')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('empty_desc')}</p>
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
              placeholder={t('search_placeholder')}
              value={search}
              onChange={handleSearchInputChange}
              aria-label={t('search_placeholder')}
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
              {t('show_all')}
            </label>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <label htmlFor="sortBy" className="text-sm font-medium text-gray-700">{t('sort_by')}</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={handleSortFieldChange}
              className="rounded-md border-gray-300 py-1 pl-2 pr-6 text-sm"
            >
              <option value="createdAt">{t('sort_createdAt')}</option>
              <option value="updatedAt">{t('sort_updatedAt')}</option>
              <option value="productName">{t('sort_productName')}</option>
              <option value="productCode">{t('sort_productCode')}</option>
              <option value="category">{t('sort_category')}</option>
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
            onClick={handleExportProducts}
            disabled={isExporting || products.length === 0}
            aria-label="Export products to Excel"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="mr-2 size-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            aria-label="Import products from Excel"
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
              className="ml-2 text-xs text-gray-500 underline"
            >
              {t('reset')}
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
            {t('pagination.page')}
            {' '}
            {page}
            {' '}
            {t('pagination.of')}
            {' '}
            {Math.ceil(pagination.total / pagination.limit)}
          </span>
        )}
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table role="table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('table.productCode')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('table.productName')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('table.category')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('table.notes')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('table.created')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('table.updated')}</th>
              <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">{t('table.actions')}</th>
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
                  {product.notes || '-'}
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
                      {t('edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(product)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
              {products.length}
              {' '}
              of
              {' '}
              {pagination.total}
              {' '}
              products
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('pagination.previous')}
            </button>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={!pagination?.hasMore}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 size-full overflow-y-auto bg-gray-600/50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mt-3 text-center">
              <h3 className="mb-2 text-lg font-medium text-gray-900">{t('delete_confirm_title')}</h3>
              <p className="mb-4 text-sm text-gray-600">
                {t('delete_confirm_desc', { productCode: deleteConfirmProduct.productCode })}
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
                  {t('delete_cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? t('delete_deleting') : t('delete_confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ProductImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
