/**
 * ProductList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays products in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Calendar, Download, Edit, Filter, Grid3X3, List, Package, Search, Tag, Trash2, Upload } from 'lucide-react';
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

type ViewMode = 'cards' | 'list';

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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchInput, setSearchInput] = useState('');

  const {
    search,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
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

  // Sync searchInput with actual search state
  React.useEffect(() => {
    if (search !== searchInput) {
      setSearchInput(search);
    }
  }, [search]);

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

  // Handle search input change (local state only)
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchInput(event.target.value);
  };

  // Handle search execution
  const handleSearch = (): void => {
    handleSearchChange(searchInput);
    setPage(1); // Reset to first page when searching
  };

  // Handle Enter key in search input
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  // Handle clear search
  const handleClearSearch = (): void => {
    setSearchInput('');
    handleSearchChange('');
    setPage(1);
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
      {/* Control Panel */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* Search Section */}
          <div className="flex flex-1 items-center space-x-2 sm:space-x-4">
            <div className="relative max-w-lg flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="size-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyDown={handleSearchKeyDown}
                aria-label={t('search_placeholder')}
                className={`block w-full rounded-lg border py-3 pl-10 pr-4 text-sm transition-all duration-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 ${
                  searchInput !== search && searchInput !== ''
                    ? 'border-blue-300 bg-blue-50 focus:border-blue-500 focus:ring-blue-500'
                    : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-blue-500'
                }`}
              />
              {searchInput !== search && (searchInput !== '' || search !== '') && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <div className="size-2 animate-pulse rounded-full bg-blue-500"></div>
                </div>
              )}
            </div>

            {/* Search Button */}
            <button
              type="button"
              onClick={handleSearch}
              disabled={searchInput === search}
              className={`inline-flex items-center rounded-lg p-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-4 ${
                searchInput === search
                  ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                  : 'bg-blue-600 text-white hover:scale-105 hover:bg-blue-700'
              }`}
              title="Search products"
            >
              <Search className="size-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Toggle controls */}
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={showAll}
                onChange={e => setShowAll(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {t('show_all')}
              </span>
            </label>
          </div>

          {/* View Toggle & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center rounded-md p-2 text-sm font-medium transition-all duration-200 sm:px-3 ${
                  viewMode === 'cards'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid3X3 className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center rounded-md p-2 text-sm font-medium transition-all duration-200 sm:px-3 ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="size-4 sm:mr-2" />
                <span className="hidden sm:inline">List</span>
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
                <option value="createdAt">{t('sort_createdAt')}</option>
                <option value="updatedAt">{t('sort_updatedAt')}</option>
                <option value="productName">{t('sort_productName')}</option>
                <option value="productCode">{t('sort_productCode')}</option>
                <option value="category">{t('sort_category')}</option>
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
              onClick={handleExportProducts}
              disabled={isExporting || products.length === 0}
              className="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="mr-2 size-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>

            {/* Import button */}
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-blue-600"
            >
              <Upload className="mr-2 size-4" />
              Import
            </button>

            {/* Clear Search */}
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="inline-flex items-center rounded-lg px-3 py-2 text-sm text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
              >
                ✕ Clear
              </button>
            )}
          </div>
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

      {/* Products Content - Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map(product => (
            <div key={product.id} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              {/* Card Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {/* Product Icon */}
                  <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                    <Package className="size-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold text-gray-900">{product.productName}</h3>
                    <p className="truncate font-mono text-sm text-gray-500">
                      {product.productCode}
                    </p>
                  </div>
                </div>

                {/* Category Badge */}
                {product.category && (
                  <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                    <Tag className="mr-1 size-3" />
                    {product.category}
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="mb-4 space-y-3">
                {/* Notes */}
                {product.notes && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="line-clamp-2 text-sm text-gray-600">
                      {product.notes}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="mr-1 size-3" />
                    Created:
                    {' '}
                    {formatDate(product.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 size-3" />
                    Updated:
                    {' '}
                    {formatDate(product.updatedAt)}
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex justify-end space-x-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  disabled={isDeleting}
                  className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Edit className="mr-1 size-4" />
                  {t('edit')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(product)}
                  disabled={isDeleting}
                  className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="mr-1 size-4" />
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products Content - List/Table View */}
      {viewMode === 'list' && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Updated
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {products.map((product, index) => (
                  <tr key={product.id} className={`transition-colors duration-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="size-10 shrink-0">
                          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                            <Package className="size-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="max-w-xs truncate text-sm font-medium text-gray-900">
                            {product.productName}
                          </div>
                          {product.notes && (
                            <div className="max-w-xs truncate text-xs text-gray-500">
                              {product.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-900">
                        {product.productCode}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {product.category
                        ? (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              <Tag className="mr-1 size-3" />
                              {product.category}
                            </span>
                          )
                        : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="mr-1 size-3" />
                        {formatDate(product.createdAt)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="mr-1 size-3" />
                        {formatDate(product.updatedAt)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          disabled={isDeleting}
                          className="inline-flex items-center rounded-lg p-2 text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title={t('edit')}
                        >
                          <Edit className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(product)}
                          disabled={isDeleting}
                          className="inline-flex items-center rounded-lg p-2 text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title={t('delete')}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List View */}
          <div className="divide-y divide-gray-200 lg:hidden">
            {products.map(product => (
              <div key={product.id} className="p-4 transition-colors duration-200 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 flex-1 items-center space-x-3">
                    <div className="shrink-0">
                      <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                        <Package className="size-5 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {product.productName}
                      </div>
                      <div className="mt-1 inline-block rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-500">
                        {product.productCode}
                      </div>
                      {product.category && (
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            <Tag className="mr-1 size-3" />
                            {product.category}
                          </span>
                        </div>
                      )}
                      {product.notes && (
                        <div className="mt-1 line-clamp-2 text-xs text-gray-500">
                          {product.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      disabled={isDeleting}
                      className="inline-flex items-center rounded-lg p-2 text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                      title={t('edit')}
                    >
                      <Edit className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(product)}
                      disabled={isDeleting}
                      className="inline-flex items-center rounded-lg p-2 text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                      title={t('delete')}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="mr-1 size-3" />
                    Created:
                    {' '}
                    {formatDate(product.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 size-3" />
                    Updated:
                    {' '}
                    {formatDate(product.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm duration-300 animate-in fade-in">
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-300 animate-in zoom-in-95">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="size-8 text-red-600" />
              </div>

              {/* Title & Content */}
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{t('delete_confirm_title')}</h3>

              {/* Product preview */}
              <div className="mb-4 rounded-lg bg-gray-50 p-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                    <Package className="size-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{deleteConfirmProduct.productName}</h4>
                    <p className="font-mono text-sm text-gray-500">{deleteConfirmProduct.productCode}</p>
                    {deleteConfirmProduct.category && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {deleteConfirmProduct.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                {t('delete_confirm_desc', { productCode: deleteConfirmProduct.productCode })}
              </p>

              {deleteError && (
                <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">{deleteError}</div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
                >
                  {t('delete_cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="mr-2 size-4" />
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
