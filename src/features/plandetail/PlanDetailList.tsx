/**
 * PlanDetailList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays plandetails in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Calendar, Clock, Download, Edit, Filter, Grid3X3, List, MapPin, Package, Target, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

import { PlanDetailSkeleton } from '@/features/plandetail/PlanDetailSkeleton';
import { usePlanDetailExport } from '@/hooks/usePlanDetailExport';
import { usePlanDetailFilters } from '@/hooks/usePlanDetailFilters';
import { usePlanDetailMutations } from '@/hooks/usePlanDetailMutations';
import { usePlanDetails } from '@/hooks/usePlanDetails';
import type { PlanDetail, PlanDetailWithRelations } from '@/types/plandetail';

type PlanDetailListProps = {
  onEdit: (plandetail: PlanDetail) => void;
  onDelete: (plandetail: PlanDetail) => void;
};

export function PlanDetailList({ onEdit, onDelete }: PlanDetailListProps): JSX.Element {
  const { userId, orgId } = useAuth();
  const t = useTranslations('plandetailList');
  const [deleteConfirmPlanDetail, setDeleteConfirmPlanDetail] = useState<PlanDetail | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [relationOptions, setRelationOptions] = useState<{
    products: { productCode: string; productName: string }[];
    locationCodes: { locationCode: string; tableName?: string }[];
    productSubCodes: { productSubCode: string; productSubDetail: string; productCode: string }[];
  }>({ products: [], locationCodes: [], productSubCodes: [] });

  const {
    filters,
    pendingFilters,
    updatePendingFilters,
    applyFilters,
    resetFilters,
  } = usePlanDetailFilters();
  const { search, planCode, productCode, productName, sortBy, sortOrder } = filters;

  // Get ownerId for multi-tenancy
  const ownerId = orgId || userId || '';

  const { plandetails, pagination, isLoading, error, refresh } = usePlanDetails({
    search,
    planCode,
    productCode,
    productName,
    sortBy,
    sortOrder,
    page: showAll ? 1 : page,
    limit: 10,
    ownerId,
    showAll,
  });

  const { deletePlanDetail, isDeleting } = usePlanDetailMutations();
  const { handleExport, isExporting } = usePlanDetailExport();

  // Fetch relationOptions (products) khi mount
  useEffect(() => {
    const fetchRelationOptions = async () => {
      try {
        const res = await fetch('/api/plandetails/relations/options');
        if (res.ok) {
          const data = await res.json();
          setRelationOptions({
            products: data.data.products || [],
            locationCodes: data.data.locationCodes || [],
            productSubCodes: data.data.productSubCodes || [],
          });
        }
      } catch {
        // silent
      }
    };
    fetchRelationOptions();
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = (plandetail: PlanDetail): void => {
    setDeleteConfirmPlanDetail(plandetail);
    setDeleteError(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteConfirmPlanDetail) {
      return;
    }

    try {
      await deletePlanDetail(deleteConfirmPlanDetail.id);
      onDelete(deleteConfirmPlanDetail);
      setDeleteConfirmPlanDetail(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete plandetail';
      setDeleteError(errorMessage);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = (): void => {
    setDeleteConfirmPlanDetail(null);
    setDeleteError(null);
  };

  // Handle sort field change
  const handleSortFieldChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    updatePendingFilters({ sortBy: event.target.value as any });
  };

  // Handle sort order toggle
  const handleSortOrderToggle = (): void => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    updatePendingFilters({ sortOrder: newSortOrder });
    // Apply immediately for sort changes
    applyFilters();
  };

  // Handle export plandetails
  const handleExportPlanDetails = async (): Promise<void> => {
    try {
      await handleExport({
        search,
        sortBy,
        sortOrder,
        ownerId,
        page: showAll ? 1 : page,
        limit: 10,
        showAll,
      });
      // No clearError needed
    } catch {
      // Error is already handled in the hook
      // Xóa dòng: console.error('Export failed:', err);
    }
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

  // Get display information for plan detail
  const getDisplayInfo = (plandetail: PlanDetailWithRelations) => {
    // Get product name
    let productName = plandetail.productCode || '-';
    if (plandetail.productCode && Array.isArray(relationOptions?.products)) {
      const found = relationOptions.products.find(p => p.productCode === plandetail.productCode);
      if (found) {
        productName = found.productName;
      }
    }

    // Get product sub detail (this is what we want to show as "Product")
    let productSubDetail = plandetail.productSubCode || '-';
    if (plandetail.productSubCode && Array.isArray(relationOptions?.productSubCodes)) {
      const found = relationOptions.productSubCodes.find(ps => ps.productSubCode === plandetail.productSubCode);
      if (found) {
        productSubDetail = found.productSubDetail;
      }
    }

    // Get location name
    let locationName = plandetail.locationCode || '-';
    if (plandetail.locationCode && Array.isArray(relationOptions?.locationCodes)) {
      const found = relationOptions.locationCodes.find(loc => loc.locationCode === plandetail.locationCode);
      if (found && found.tableName) {
        locationName = found.tableName;
      }
    }

    return {
      productName,
      productSubDetail,
      locationName,
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div role="status" aria-label="Loading plandetails" className="sr-only">
          Loading plandetails...
        </div>
        <PlanDetailSkeleton data-testid="plandetail-list-skeleton" />
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
  if (plandetails.length === 0 && !planCode && !productCode && !productName) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No plandetails found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create your first plandetail to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* Filter Section */}
          <div className="flex-1 space-y-6">
            {/* Main Filters */}
            <div>
              <h3 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                <Filter className="mr-2 size-4 text-blue-600" />
                Bộ lọc tìm kiếm
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Plan Code Filter */}
                <div>
                  <label htmlFor="plan-code-filter" className="mb-2 block text-sm font-medium text-gray-700">
                    🎯 Plan Code
                  </label>
                  <input
                    id="plan-code-filter"
                    type="text"
                    placeholder="VD: PLN001, PLN-2024..."
                    value={pendingFilters.planCode}
                    onChange={e => updatePendingFilters({ planCode: e.target.value })}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Product Code Filter */}
                <div>
                  <label htmlFor="product-code-filter" className="mb-2 block text-sm font-medium text-gray-700">
                    📦 Mã Hàng
                  </label>
                  <input
                    id="product-code-filter"
                    type="text"
                    placeholder="VD: SP001, PROD-001..."
                    value={pendingFilters.productCode}
                    onChange={e => updatePendingFilters({ productCode: e.target.value })}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Product Name Filter */}
                <div>
                  <label htmlFor="product-name-filter" className="mb-2 block text-sm font-medium text-gray-700">
                    🏷️ Tên Sản Phẩm
                  </label>
                  <input
                    id="product-name-filter"
                    type="text"
                    placeholder="VD: Áo thun, Quần jeans..."
                    value={pendingFilters.productName}
                    onChange={e => updatePendingFilters({ productName: e.target.value })}
                    className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Filter Actions & Settings */}
            <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
              {/* Filter Actions */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Filter className="mr-2 size-4" />
                  Áp dụng lọc
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                >
                  Xóa bộ lọc
                </button>
              </div>

              {/* Sort & Display Options */}
              <div className="flex items-center space-x-4">
                {/* Sort Controls */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-500">Sắp xếp:</span>
                  <select
                    value={pendingFilters.sortBy}
                    onChange={handleSortFieldChange}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="createdAt">Ngày tạo</option>
                    <option value="updatedAt">Ngày cập nhật</option>
                    <option value="productSubCode">Mã sản phẩm con</option>
                    <option value="locationCode">Mã vị trí</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleSortOrderToggle}
                    className="rounded-lg border border-gray-200 p-1.5 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                    title={sortOrder === 'asc' ? 'Đang sắp xếp tăng dần' : 'Đang sắp xếp giảm dần'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>

                {/* Show All Toggle */}
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={showAll}
                    onChange={e => setShowAll(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-10 rounded-full bg-gray-200 after:absolute after:left-px after:top-px after:size-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {t('show_all') || 'Hiện tất cả'}
                  </span>
                </label>
              </div>
            </div>
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
                    ? 'bg-white text-blue-600 shadow-sm'
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
                    ? 'bg-white text-blue-600 shadow-sm'
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
                <option value="createdAt">{t('created_date') || 'Sort by Created'}</option>
                <option value="updatedAt">{t('updated_date') || 'Sort by Updated'}</option>
                <option value="plandetailName">{t('plandetail_name') || 'Sort by Name'}</option>
                <option value="plandetailCode">{t('plandetail_code') || 'Sort by Code'}</option>
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
              onClick={handleExportPlanDetails}
              disabled={isExporting || plandetails.length === 0}
              className="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="mr-2 size-4" />
              {isExporting ? (t('exporting') || 'Exporting...') : (t('export') || 'Export')}
            </button>

          </div>
        </div>
      </div>

      {/* Filter Results Info */}
      {(planCode || productCode || productName) && (
        <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Filter className="size-4 text-blue-600" />
            <span>Đang lọc theo:</span>
            {planCode && (
              <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                Plan:
                {planCode}
              </span>
            )}
            {productCode && (
              <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                Mã:
                {productCode}
              </span>
            )}
            {productName && (
              <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
                Tên:
                {productName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Plan Details Display */}
      {viewMode === 'card'
        ? (
      /* Card View */
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {plandetails.map((plandetailRaw) => {
                const plandetail = plandetailRaw as PlanDetailWithRelations;
                const { productName, productSubDetail, locationName } = getDisplayInfo(plandetail);

                return (
                  <div key={plandetail.id} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                    {/* Card Header */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Plan Detail Icon */}
                        <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500">
                          <Calendar className="size-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-semibold text-gray-900">
                            {plandetail.plan?.planCode || 'No Plan'}
                          </h3>
                          <p className="truncate text-sm text-gray-500">
                            {productName}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {plandetail.status && (
                        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                          {plandetail.status}
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="mb-4 space-y-3">
                      {/* Location & Product Info */}
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          {plandetail.locationCode && (
                            <div className="flex items-center text-gray-600">
                              <MapPin className="mr-2 size-4 text-blue-500" />
                              <span className="font-medium">Location:</span>
                              <span className="ml-1 truncate font-semibold text-gray-800">{locationName}</span>
                            </div>
                          )}
                          {plandetail.productSubCode && (
                            <div className="flex items-center text-gray-600">
                              <Package className="mr-2 size-4 text-blue-500" />
                              <span className="font-medium">Product:</span>
                              <span className="ml-1 truncate font-semibold text-gray-800">{productSubDetail}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Planned Quantity */}
                      <div className="rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center">
                            <div className="mr-4 flex size-10 items-center justify-center rounded-full bg-blue-500">
                              <Target className="size-5 text-white" />
                            </div>
                            <div className="text-center">
                              <span className="text-sm font-medium uppercase tracking-wider text-blue-600">Planned Quantity</span>
                              <div className="text-3xl font-bold text-blue-700">{plandetail.plannedQuantity || 0}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      {(plandetail.plannedStartDate || plandetail.plannedEndDate) && (
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          {plandetail.plannedStartDate && (
                            <div className="flex items-center">
                              <Clock className="mr-1 size-3" />
                              Start:
                              {' '}
                              {formatDate(plandetail.plannedStartDate)}
                            </div>
                          )}
                          {plandetail.plannedEndDate && (
                            <div className="flex items-center">
                              <Clock className="mr-1 size-3" />
                              End:
                              {' '}
                              {formatDate(plandetail.plannedEndDate)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="flex justify-end space-x-2 border-t border-gray-100 pt-4">
                      <button
                        type="button"
                        onClick={() => onEdit(plandetail)}
                        disabled={isDeleting}
                        className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-800"
                      >
                        <Edit className="mr-1 size-4" />
                        {t('edit') || 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(plandetail)}
                        disabled={isDeleting}
                        className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800"
                      >
                        <Trash2 className="mr-1 size-4" />
                        {t('delete') || 'Delete'}
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
                  <div className="col-span-4">Plan & Product</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-2">Planned Qty</div>
                  <div className="col-span-3">Dates</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* List Items */}
              <div className="divide-y divide-gray-100">
                {plandetails.map((plandetailRaw) => {
                  const plandetail = plandetailRaw as PlanDetailWithRelations;
                  const { productName, productSubDetail, locationName } = getDisplayInfo(plandetail);

                  return (
                    <div key={plandetail.id} className="px-6 py-4 transition-colors duration-150 hover:bg-gray-50">
                      <div className="grid grid-cols-12 items-center gap-4">
                        {/* Plan & Product Info */}
                        <div className="col-span-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500">
                              <Calendar className="size-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {plandetail.plan?.planCode || 'No Plan'}
                              </p>
                              <p className="truncate text-xs text-gray-500">{productName}</p>
                              <p className="truncate text-xs font-medium text-indigo-600">{productSubDetail}</p>
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="col-span-2">
                          {plandetail.locationCode
                            ? (
                                <div className="flex items-center text-sm text-gray-600">
                                  <MapPin className="mr-1 size-3 text-blue-500" />
                                  <span className="font-medium">{locationName}</span>
                                </div>
                              )
                            : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                        </div>

                        {/* Planned Quantity */}
                        <div className="col-span-2">
                          <div className="flex items-center">
                            <Target className="mr-2 size-4 text-blue-500" />
                            <div>
                              <span className="text-xs font-medium uppercase tracking-wider text-blue-600">Planned</span>
                              <div className="text-lg font-bold text-blue-700">{plandetail.plannedQuantity || 0}</div>
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="col-span-3">
                          {plandetail.plannedStartDate
                            ? (
                                <div className="flex items-center text-xs text-gray-500">
                                  <Clock className="mr-1 size-3" />
                                  {formatDate(plandetail.plannedStartDate)}
                                </div>
                              )
                            : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-1">
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => onEdit(plandetail)}
                              disabled={isDeleting}
                              className="rounded p-1 text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-800"
                              title={t('edit') || 'Edit'}
                            >
                              <Edit className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(plandetail)}
                              disabled={isDeleting}
                              className="rounded p-1 text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800"
                              title={t('delete') || 'Delete'}
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
            {t('showing', { count: plandetails.length, total: pagination.total }) || `Showing ${plandetails.length} of ${pagination.total} plan details`}
            {pagination.page && ` • ${t('page', { page: pagination.page }) || `Page ${pagination.page}`}`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('previous') || 'Previous'}
            </button>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={!pagination?.hasMore}
              className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('next') || 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmPlanDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm duration-300 animate-in fade-in">
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-300 animate-in zoom-in-95">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="size-8 text-red-600" />
              </div>

              {/* Title & Content */}
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{t('confirm_deletion') || 'Confirm Deletion'}</h3>

              {/* Plan Detail preview */}
              <div className="mb-4 rounded-lg bg-gray-50 p-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500">
                    <Calendar className="size-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{deleteConfirmPlanDetail.productCode || 'Plan Detail'}</h4>
                    <p className="text-sm text-gray-500">{deleteConfirmPlanDetail.productCode || 'No Product'}</p>
                    {deleteConfirmPlanDetail.status && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {deleteConfirmPlanDetail.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                {t('delete_confirm_message', { name: deleteConfirmPlanDetail.productCode }) || 'Are you sure you want to delete this plan detail? This action cannot be undone.'}
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
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="mr-2 size-4" />
                  {isDeleting ? (t('deleting') || 'Deleting...') : (t('confirm_delete') || 'Confirm Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
