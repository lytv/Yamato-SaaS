/**
 * ProductionStepDetailList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays production step details in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import React, { useEffect, useState } from 'react';

import { ProductionStepDetailSkeleton } from '@/features/productionStepDetail/ProductionStepDetailSkeleton';
import { useProductionStepDetailFilters } from '@/hooks/useProductionStepDetailFilters';
import { useProductionStepDetailMutations } from '@/hooks/useProductionStepDetailMutations';
import { useProductionStepDetails } from '@/hooks/useProductionStepDetails';
import { useProductionSteps } from '@/hooks/useProductionSteps';
import { useProducts } from '@/hooks/useProducts';

export function ProductionStepDetailList(): JSX.Element {
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

  // Format date for display
  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
        <div role="status" aria-label="Loading production step details" className="sr-only">
          Loading production step details...
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
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (productionStepDetails.length === 0 && !search && !productId && !productionStepId) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No production step details found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create your first production step detail to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
        <div className="max-w-lg flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search production step details..."
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchInputKeyDown}
              aria-label="Search production step details"
              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 leading-5 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:placeholder:text-gray-400 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          {/* Product Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="productFilter" className="text-sm font-medium text-gray-700">
              Product:
            </label>
            <select
              id="productFilter"
              value={productId || ''}
              onChange={handleProductFilterChange}
              aria-label="Filter by product"
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.productCode}
                  {' '}
                  -
                  {product.productName}
                </option>
              ))}
            </select>
          </div>

          {/* Production Step Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="productionStepFilter" className="text-sm font-medium text-gray-700">
              Step:
            </label>
            <select
              id="productionStepFilter"
              value={productionStepId || ''}
              onChange={handleProductionStepFilterChange}
              aria-label="Filter by production step"
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Steps</option>
              {productionSteps.map(step => (
                <option key={step.id} value={step.id}>
                  {step.stepCode}
                  {' '}
                  -
                  {step.stepName}
                </option>
              ))}
            </select>
          </div>

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
              <option value="sequenceNumber">Sequence</option>
              <option value="factoryPrice">Factory Price</option>
              <option value="calculatedPrice">Calculated Price</option>
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

          {/* Clear Filters */}
          {(search || productId || productionStepId) && (
            <button
              type="button"
              onClick={resetFilters}
              aria-label="Clear filters"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {(search || productId || productionStepId) && (
        <div className="text-sm text-gray-600">
          {search && (
            <>
              Search results for "
              {search}
              "
              {(productId || productionStepId) && ' • '}
            </>
          )}
          {productId && (
            <>
              Product:
              {' '}
              {productMap.get(productId)?.productName || `ID ${productId}`}
              {productionStepId && ' • '}
            </>
          )}
          {productionStepId && (
            <>
              Step:
              {productionStepMap.get(productionStepId)?.stepName || `ID ${productionStepId}`}
            </>
          )}
        </div>
      )}

      {/* Production Step Detail Count */}
      <div className="text-sm text-gray-600">
        Showing
        {' '}
        {productionStepDetails.length}
        {' '}
        of
        {' '}
        {pagination?.total || 0}
        {' '}
        production step details
        {pagination?.page && (
          <span>
            {' '}
            • Page
            {pagination.page}
          </span>
        )}
      </div>

      {/* Production Step Details Table */}
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        {/* Nút xóa hàng loạt */}
        {selectedIds.length > 0 && (
          <div className="p-2">
            <button
              type="button"
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              Delete Selected (
              {selectedIds.length}
              )
            </button>
          </div>
        )}
        <table role="table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Checkbox chọn tất cả */}
              <th className="px-2 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === productionStepDetails.length && productionStepDetails.length > 0}
                  onChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Production Step
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Sequence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Factory Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Calculated Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Flags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {productionStepDetails.map((detail) => {
              const product = productMap.get(detail.productId);
              const productionStep = productionStepMap.get(detail.productionStepId);

              return (
                <tr key={detail.id} className="hover:bg-gray-50">
                  {/* Checkbox chọn từng dòng */}
                  <td className="px-2 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(detail.id)}
                      onChange={() => handleSelectRow(detail.id)}
                      aria-label={`Select row ${detail.id}`}
                    />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {product
                      ? (
                          <div>
                            <div className="font-medium">{product.productCode}</div>
                            <div className="text-gray-500">{product.productName}</div>
                          </div>
                        )
                      : (
                          <span className="text-gray-400">
                            Product #
                            {detail.productId}
                          </span>
                        )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {productionStep
                      ? (
                          <div>
                            <div className="font-medium">{productionStep.stepCode}</div>
                            <div className="text-gray-500">{productionStep.stepName}</div>
                          </div>
                        )
                      : (
                          <span className="text-gray-400">
                            Step #
                            {detail.productionStepId}
                          </span>
                        )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      #
                      {detail.sequenceNumber}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatPrice(detail.factoryPrice)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatPrice(detail.calculatedPrice)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1">
                      {detail.isFinalStep && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Final
                        </span>
                      )}
                      {detail.isVtStep && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                          VT
                        </span>
                      )}
                      {detail.isParkingStep && (
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                          Parking
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(detail.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="text-indigo-600 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
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
            Prev
          </button>
          <span className="text-sm text-gray-700">
            Page
            {' '}
            {pagination.page}
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
            Next
          </button>
        </div>
      )}

      {/* Add confirmation modal for delete */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded bg-white p-6 shadow-xl">
            <div className="mb-4 text-lg font-semibold">
              Are you sure you want to delete
              {selectedIds.length}
              {' '}
              selected rows?
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={cancelDeleteSelected} className="rounded border px-4 py-2">Cancel</button>
              <button type="button" onClick={confirmDeleteSelected} className="rounded bg-red-600 px-4 py-2 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
