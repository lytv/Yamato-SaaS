/**
 * PlanDetailList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays plandetails in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download, Search, Filter, Calendar, Edit, Trash2, Package, MapPin, Clock, Grid3X3, List, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

import { PlanDetailSkeleton } from '@/features/plandetail/PlanDetailSkeleton';
import { usePlanDetailExport } from '@/hooks/usePlanDetailExport';
import { usePlanDetailFilters } from '@/hooks/usePlanDetailFilters';
import { usePlanDetailMutations } from '@/hooks/usePlanDetailMutations';
import { usePlanDetails } from '@/hooks/usePlanDetails';
import type { ImportPlanDetailResult, PlanDetail, PlanDetailWithRelations } from '@/types/plandetail';

import { PlanDetailImportModal } from './PlanDetailImportModal';

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
    updateFilters,
    resetFilters,
  } = usePlanDetailFilters();
  const { search, sortBy, sortOrder } = filters;

  // Get ownerId for multi-tenancy
  const ownerId = orgId || userId || '';

  const { plandetails, pagination, isLoading, error, refresh } = usePlanDetails({
    search,
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
            productSubCodes: data.data.productSubCodes || []
          });
        }
      } catch (err) {
        // silent
      }
    };
    fetchRelationOptions();
  }, []);

  // Handle import success
  const handleImportSuccess = (_result: ImportPlanDetailResult) => {
    refresh();
  };

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

  // Handle search input change
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    updateFilters({ search: event.target.value });
  };

  // Handle sort field change
  const handleSortFieldChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    updateFilters({ sortBy: event.target.value as any });
  };

  // Handle sort order toggle
  const handleSortOrderToggle = (): void => {
    updateFilters({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
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
    } catch (err) {
      // Error is already handled in the hook
      console.error('Export failed:', err);
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
      locationName
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
  if (plandetails.length === 0 && !search) {
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
                placeholder={t('search_placeholder') || 'Search plan details...'}
                value={search}
                onChange={handleSearchInputChange}
                aria-label={t('search_placeholder') || 'Search plan details'}
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder:text-gray-500 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {t('show_all') || 'Show All'}
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
                    ? 'bg-white text-blue-600 shadow-sm'
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
                    ? 'bg-white text-blue-600 shadow-sm'
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
                <option value="createdAt">{t('created_date') || 'Sort by Created'}</option>
                <option value="updatedAt">{t('updated_date') || 'Sort by Updated'}</option>
                <option value="plandetailName">{t('plandetail_name') || 'Sort by Name'}</option>
                <option value="plandetailCode">{t('plandetail_code') || 'Sort by Code'}</option>
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
              onClick={handleExportPlanDetails}
              disabled={isExporting || plandetails.length === 0}
              className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? (t('exporting') || 'Exporting...') : (t('export') || 'Export')}
            </button>

            {/* Import Modal/Button */}
            <PlanDetailImportModal onSuccess={handleImportSuccess} />

            {/* Clear Search */}
            {search && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-gray-500 underline hover:text-gray-700"
              >
                {t('clear_search') || 'Clear'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Results Info */}
      {search && (
        <div className="text-sm text-gray-600">
          {t('search_results_for', { search }) || `Search results for "${search}"`}
        </div>
      )}

      {/* Plan Details Display */}
      {viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plandetails.map((plandetailRaw) => {
            const plandetail = plandetailRaw as PlanDetailWithRelations;
            const { productName, productSubDetail, locationName } = getDisplayInfo(plandetail);
            
            return (
              <div key={plandetail.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {/* Plan Detail Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {plandetail.plan?.planCode || 'No Plan'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {productName}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  {plandetail.status && (
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {plandetail.status}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="space-y-3 mb-4">
                  {/* Location & Product Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      {plandetail.locationCode && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium">Location:</span>
                          <span className="ml-1 truncate font-semibold text-gray-800">{locationName}</span>
                        </div>
                      )}
                      {plandetail.productSubCode && (
                        <div className="flex items-center text-gray-600">
                          <Package className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium">Product:</span>
                          <span className="ml-1 truncate font-semibold text-gray-800">{productSubDetail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Planned Quantity */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-center">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-blue-600 font-medium uppercase tracking-wider">Planned Quantity</span>
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
                          <Clock className="w-3 h-3 mr-1" />
                          Start: {formatDate(plandetail.plannedStartDate)}
                        </div>
                      )}
                      {plandetail.plannedEndDate && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          End: {formatDate(plandetail.plannedEndDate)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => onEdit(plandetail)}
                    disabled={isDeleting}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {t('edit') || 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(plandetail)}
                    disabled={isDeleting}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t('delete') || 'Delete'}
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
                <div key={plandetail.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Plan & Product Info */}
                    <div className="col-span-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {plandetail.plan?.planCode || 'No Plan'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{productName}</p>
                          <p className="text-xs font-medium text-indigo-600 truncate">{productSubDetail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="col-span-2">
                      {plandetail.locationCode ? (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-3 h-3 mr-1 text-blue-500" />
                          <span className="font-medium">{locationName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>

                    {/* Planned Quantity */}
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-2 text-blue-500" />
                        <div>
                          <span className="text-xs text-blue-600 font-medium uppercase tracking-wider">Planned</span>
                          <div className="text-lg font-bold text-blue-700">{plandetail.plannedQuantity || 0}</div>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="col-span-3">
                      {plandetail.plannedStartDate ? (
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(plandetail.plannedStartDate)}
                        </div>
                      ) : (
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
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all duration-200"
                          title={t('edit') || 'Edit'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(plandetail)}
                          disabled={isDeleting}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-200"
                          title={t('delete') || 'Delete'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative mx-4 w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              
              {/* Title & Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('confirm_deletion') || 'Confirm Deletion'}</h3>
              
              {/* Plan Detail preview */}
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{deleteConfirmPlanDetail.productCode || 'Plan Detail'}</h4>
                    <p className="text-sm text-gray-500">{deleteConfirmPlanDetail.productCode || 'No Product'}</p>
                    {deleteConfirmPlanDetail.status && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                        {deleteConfirmPlanDetail.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {t('delete_confirm_message', { name: deleteConfirmPlanDetail.productCode }) || 'Are you sure you want to delete this plan detail? This action cannot be undone.'}
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
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
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
