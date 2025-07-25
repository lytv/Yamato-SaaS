/**
 * ProductionStepDetailList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays production step details in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

import { ProductionStepDetailSkeleton } from '@/features/productionStepDetail/ProductionStepDetailSkeleton';
import { useProductionStepDetailFilters } from '@/hooks/useProductionStepDetailFilters';
import { useProductionStepDetailMutations } from '@/hooks/useProductionStepDetailMutations';
import { useProductionStepDetails } from '@/hooks/useProductionStepDetails';
import { useProductionSteps } from '@/hooks/useProductionSteps';
import { useProducts } from '@/hooks/useProducts';

export function ProductionStepDetailList(): JSX.Element {
  const t = useTranslations('productionStepDetail.list');
  const { userId, orgId } = useAuth();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    search,
    sortBy,
    sortOrder,
    productId,
    productionStepId,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    handleProductIdChange,
    handleProductionStepIdChange,
    resetFilters,
  } = useProductionStepDetailFilters();

  // Get ownerId for multi-tenancy
  const ownerId = orgId || userId || '';

  const { productionStepDetails, pagination, isLoading, error, refresh } = useProductionStepDetails({
    search,
    sortBy,
    sortOrder,
    productId,
    productionStepId,
    page,
    limit: 10,
    ownerId,
  });

  // Load products and production steps for display
  const { products } = useProducts({ ownerId, limit: 100 });
  const { productionSteps } = useProductionSteps({ ownerId, limit: 100 });

  const { deleteProductionStepDetail, isDeleting } = useProductionStepDetailMutations();

  // Create lookup maps for efficient display
  const productMap = new Map(products.map(p => [p.id, p]));
  const productionStepMap = new Map(productionSteps.map(ps => [ps.id, ps]));


  // Format price for display
  const formatPrice = (price?: string | null): string => {
    if (!price) {
      return '-';
    }
    return `$${price}`;
  };

  // Handle search input change chỉ update state
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchInput(event.target.value);
  };

  // Khi nhấn Enter mới trigger search
  const handleSearchInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      handleSearchChange(searchInput);
    }
  };

  // Handle sort field change
  const handleSortFieldChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    handleSortChange(event.target.value as any);
  };

  // Handle sort order toggle
  const handleSortOrderToggle = (): void => {
    handleSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Handle product filter change
  const handleProductFilterChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = event.target.value;
    handleProductIdChange(value === '' ? undefined : Number(value));
  };

  // Handle production step filter change
  const handleProductionStepFilterChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = event.target.value;
    handleProductionStepIdChange(value === '' ? undefined : Number(value));
  };

  // Khi search thay đổi từ hook, đồng bộ lại input
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Xử lý chọn tất cả
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(productionStepDetails.map(d => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Xử lý chọn từng dòng
  const handleSelectRow = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Xử lý xóa nhiều dòng
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSelected = async () => {
    for (const id of selectedIds) {
      try {
        await deleteProductionStepDetail(id);
      } catch {}
    }
    setSelectedIds([]);
    refresh();
    setShowDeleteConfirm(false);
  };

  const cancelDeleteSelected = () => {
    setShowDeleteConfirm(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div role="status" aria-label={t('loading')} className="sr-only">
          {t('loading')}
        </div>
        <ProductionStepDetailSkeleton data-testid="production-step-detail-list-skeleton" />
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
  if (productionStepDetails.length === 0 && !search && !productId && !productionStepId) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('empty_title')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('empty_desc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Search and Filter Controls */}
      <div className="rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 p-6 shadow-sm border border-gray-200">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchInputKeyDown}
              aria-label={t('search_placeholder')}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  handleSearchChange('');
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Product Filter */}
            <div className="space-y-2">
              <label htmlFor="productFilter" className="flex items-center text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {t('product_label')}
              </label>
              <select
                id="productFilter"
                value={productId || ''}
                onChange={handleProductFilterChange}
                aria-label={t('product_aria')}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 shadow-sm"
              >
                <option value="">{t('all_products')}</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.productCode} - {product.productName}
                  </option>
                ))}
              </select>
            </div>

            {/* Production Step Filter */}
            <div className="space-y-2">
              <label htmlFor="productionStepFilter" className="flex items-center text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {t('step_label')}
              </label>
              <select
                id="productionStepFilter"
                value={productionStepId || ''}
                onChange={handleProductionStepFilterChange}
                aria-label={t('step_aria')}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200 shadow-sm"
              >
                <option value="">{t('all_steps')}</option>
                {productionSteps.map(step => (
                  <option key={step.id} value={step.id}>
                    {step.stepCode} - {step.stepName}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Field */}
            <div className="space-y-2">
              <label htmlFor="sortBy" className="flex items-center text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                {t('sort_by')}
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={handleSortFieldChange}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all duration-200 shadow-sm"
              >
                <option value="createdAt">{t('sort_createdAt')}</option>
                <option value="updatedAt">{t('sort_updatedAt')}</option>
                <option value="sequenceNumber">{t('sort_sequenceNumber')}</option>
                <option value="factoryPrice">{t('sort_factoryPrice')}</option>
                <option value="calculatedPrice">{t('sort_calculatedPrice')}</option>
                <option value="product">{t('sort_product')}</option>
                <option value="productionStep">{t('sort_productionStep')}</option>
              </select>
            </div>

            {/* Sort Order & Actions */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {t('actions')}
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleSortOrderToggle}
                  aria-label="Sort order"
                  className={`
                    flex-1 inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 shadow-sm
                    ${sortOrder === 'desc' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortOrder === 'desc' ? "M19 14l-7 7m0 0l-7-7m7 7V3" : "M5 10l7-7m0 0l7 7m-7-7v18"} />
                  </svg>
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </button>

                {/* Clear Filters */}
                {(search || productId || productionStepId) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex-1 inline-flex items-center justify-center rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {t('reset')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(search || productId || productionStepId) && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">{t('active_filters')}:</span>
              
              {search && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  "{search}"
                  <button
                    type="button"
                    onClick={() => handleSearchChange('')}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {productId && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  {productMap.get(productId)?.productName || `ID ${productId}`}
                  <button
                    type="button"
                    onClick={() => handleProductIdChange(undefined)}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}

              {productionStepId && (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {productionStepMap.get(productionStepId)?.stepName || `ID ${productionStepId}`}
                  <button
                    type="button"
                    onClick={() => handleProductionStepIdChange(undefined)}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {(search || productId || productionStepId) && (
        <div className="text-sm text-gray-600">
          {search && (
            <>
              {t('search_results_for')} "{search}"{(productId || productionStepId) && ' • '}
            </>
          )}
          {productId && (
            <>
              {t('product_label')}: {productMap.get(productId)?.productName || `ID ${productId}`}{productionStepId && ' • '}
            </>
          )}
          {productionStepId && (
            <>
              {t('step_label')}: {productionStepMap.get(productionStepId)?.stepName || `ID ${productionStepId}`}
            </>
          )}
        </div>
      )}

      {/* Production Step Detail Count */}
      <div className="text-sm text-gray-600">
        {t('showing', { count: productionStepDetails.length, total: pagination?.total || 0 })}
        {pagination?.page && (
          <span>
            {' '}
            {t('pagination.page')} {page} {t('pagination.of')} {Math.ceil(pagination.total / pagination.limit)}
          </span>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {selectedIds.length} {t('items_selected')}
                </h3>
                <p className="text-sm text-red-700">{t('bulk_action_warning')}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm border border-red-300 hover:bg-red-50"
                onClick={() => setSelectedIds([])}
              >
                {t('cancel_selection')}
              </button>
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('deleting')}
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('delete_selected')} ({selectedIds.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Card-based Layout */}
      <div className="space-y-4">
        {/* Header Row with Checkbox */}
        <div className="flex items-center space-x-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-200">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedIds.length === productionStepDetails.length && productionStepDetails.length > 0}
              onChange={handleSelectAll}
              aria-label="Select all rows"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm font-medium text-indigo-700">
              {selectedIds.length === productionStepDetails.length && productionStepDetails.length > 0 
                ? t('deselect_all') 
                : t('select_all')}
            </label>
          </div>
          <div className="text-sm text-indigo-600">
            {selectedIds.length > 0 && `${selectedIds.length} ${t('selected_items')}`}
          </div>
        </div>

        {/* Production Step Details Cards */}
        <div className="grid gap-4">
          {productionStepDetails.map((detail) => {
            const product = productMap.get(detail.productId);
            const productionStep = productionStepMap.get(detail.productionStepId);
            const isSelected = selectedIds.includes(detail.id);

            return (
              <div key={detail.id} className={`
                relative rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg
                ${isSelected 
                  ? 'border-indigo-300 bg-indigo-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}>
                {/* Selection Checkbox */}
                <div className="absolute top-4 right-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectRow(detail.id)}
                    aria-label={`Select row ${detail.id}`}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Product & Step Info - 4 columns */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Product Info */}
                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200">
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">{t('table.product')}</span>
                      </div>
                      {product ? (
                        <div>
                          <div className="font-bold text-lg text-blue-900">{product.productCode}</div>
                          <div className="text-sm text-blue-700 mt-1">{product.productName}</div>
                        </div>
                      ) : (
                        <span className="text-blue-400 italic">Product #{detail.productId}</span>
                      )}
                    </div>

                    {/* Production Step Info */}
                    <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 border border-purple-200">
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">{t('table.productionStep')}</span>
                      </div>
                      {productionStep ? (
                        <div>
                          <div className="font-bold text-lg text-purple-900">{productionStep.stepCode}</div>
                          <div className="text-sm text-purple-700 mt-1">{productionStep.stepName}</div>
                        </div>
                      ) : (
                        <span className="text-purple-400 italic">Step #{detail.productionStepId}</span>
                      )}
                    </div>

                    {/* Sequence Number */}
                    <div className="text-center">
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        #{detail.sequenceNumber}
                      </span>
                    </div>
                  </div>

                  {/* Pricing Info - 3 columns */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="text-center">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        {t('pricing_info')}
                      </h4>
                    </div>

                    {/* Factory Price */}
                    <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 p-4 border border-green-200">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">{t('table.factoryPrice')}</div>
                        <div className="text-2xl font-bold text-green-900">
                          {detail.factoryPrice ? (
                            <span className="flex items-center justify-center">
                              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                              </svg>
                              {formatPrice(detail.factoryPrice)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Calculated Price */}
                    <div className="rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 p-4 border border-orange-200">
                      <div className="text-center">
                        <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">{t('table.calculatedPrice')}</div>
                        <div className="text-2xl font-bold text-orange-900">
                          {detail.calculatedPrice ? (
                            <span className="flex items-center justify-center">
                              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
                              </svg>
                              {formatPrice(detail.calculatedPrice)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Limits - 3 columns */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="text-center">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {t('quantity_limits')}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gradient-to-br from-sky-50 to-sky-100 p-3 border border-sky-200 text-center">
                        <div className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-1">{t('table.quantityLimit1')}</div>
                        <div className="text-xl font-bold text-sky-900">
                          {detail.quantityLimit1 !== null ? (
                            <span className="flex items-center justify-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                              {detail.quantityLimit1.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">∞</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 p-3 border border-cyan-200 text-center">
                        <div className="text-xs font-semibold text-cyan-700 uppercase tracking-wide mb-1">{t('table.quantityLimit2')}</div>
                        <div className="text-xl font-bold text-cyan-900">
                          {detail.quantityLimit2 !== null ? (
                            <span className="flex items-center justify-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                              {detail.quantityLimit2.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">∞</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Flags & Actions - 2 columns */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Status Badges */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide text-center mb-2">
                        {t('status_flags')}
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        {/* Final Step */}
                        <div className={`
                          inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-all
                          ${detail.isFinalStep 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }
                        `}>
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {detail.isFinalStep ? t('final_step') : t('not_final')}
                        </div>

                        {/* VT Step */}
                        <div className={`
                          inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-all
                          ${detail.isVtStep 
                            ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }
                        `}>
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {detail.isVtStep ? 'VT Step' : t('not_vt')}
                        </div>

                        {/* Parking Step */}
                        <div className={`
                          inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-all
                          ${detail.isParkingStep 
                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }
                        `}>
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          {detail.isParkingStep ? t('parking_step') : t('not_parking')}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => { /* handle edit */ }}
                        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => { /* handle delete */ }}
                        className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-pink-600 px-3 py-2 text-sm font-medium text-white shadow-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            {t('pagination.previous')}
          </button>
          <span className="text-sm text-gray-700">
            {t('pagination.page')}
            {' '}
            {page}
            {' / '}
            {Math.max(1, Math.ceil(pagination.total / pagination.limit))}
          </span>
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setPage(p => (pagination.hasMore ? p + 1 : p))}
            disabled={!pagination.hasMore}
            aria-label="Next page"
          >
            {t('pagination.next')}
          </button>
        </div>
      )}

      {/* Add confirmation modal for delete */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-medium text-gray-900">{t('delete_confirm_title')}</h3>
            <p className="mb-4 text-sm text-gray-600">
              {t('delete_confirm_desc')}
            </p>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={cancelDeleteSelected} className="rounded border px-4 py-2">{t('delete_cancel')}</button>
              <button type="button" onClick={confirmDeleteSelected} className="rounded bg-red-600 px-4 py-2 text-white">{isDeleting ? t('delete_deleting') : t('delete_confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
