/**
 * PlanList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays plans in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Calendar, CalendarDays, CheckCircle, Clock, Download, Edit, Filter, Grid3X3, List, Search, Target, Trash2, Upload, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

import { PlanSkeleton } from '@/features/plan/PlanSkeleton';
import { usePlanExport } from '@/hooks/usePlanExport';
import { usePlanFilters } from '@/hooks/usePlanFilters';
import { usePlanMutations } from '@/hooks/usePlanMutations';
import { usePlans } from '@/hooks/usePlans';
import type { ImportResult } from '@/types/import';
import type { Plan } from '@/types/plan';

import { PlanImportModal } from './PlanImportModal';

type PlanListProps = {
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
};

export function PlanList({ onEdit, onDelete }: PlanListProps): JSX.Element {
  const { userId, orgId } = useAuth();
  const [deleteConfirmPlan, setDeleteConfirmPlan] = useState<Plan | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const {
    search,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    resetFilters,
  } = usePlanFilters();

  const t = useTranslations('PlanList');

  // Get ownerId for multi-tenancy
  const ownerId = orgId || userId || '';

  const { plans, pagination, isLoading, error, refresh } = usePlans({
    search,
    sortBy,
    sortOrder,
    page: showAll ? 1 : page,
    limit: 10,
    ownerId,
    showAll,
  });

  const { deletePlan, isDeleting } = usePlanMutations();
  const { exportPlans, isExporting, exportError, clearError } = usePlanExport();

  // Handle import success
  const handleImportSuccess = (_result: ImportResult) => {
    // Refresh plan list
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
  const handleDeleteClick = (plan: Plan): void => {
    setDeleteConfirmPlan(plan);
    setDeleteError(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteConfirmPlan) {
      return;
    }

    try {
      await deletePlan(deleteConfirmPlan.id);
      onDelete(deleteConfirmPlan);
      setDeleteConfirmPlan(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete plan';
      setDeleteError(errorMessage);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = (): void => {
    setDeleteConfirmPlan(null);
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

  // Handle export plans
  const handleExportPlans = async (): Promise<void> => {
    try {
      await exportPlans({
        search,
        sortBy,
        sortOrder,
      });
      clearError(); // Clear any previous errors
    } catch {
      // Error is already handled in the hook
      // Xóa dòng: console.error('Export failed:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div role="status" aria-label={t('loading_plans')} className="sr-only">
          {t('loading_plans')}
        </div>
        <PlanSkeleton data-testid="plan-list-skeleton" />
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
  if (plans.length === 0 && !search) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('no_entries_found')}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('create_first_entry')}
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
                placeholder={t('search_placeholder') || 'Search plans...'}
                value={search}
                onChange={handleSearchInputChange}
                aria-label={t('search_placeholder') || 'Search plans'}
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm transition-all duration-200 placeholder:text-gray-500 focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {t('show_all') || 'Show All'}
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
                    ? 'bg-white text-green-600 shadow-sm'
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
                    ? 'bg-white text-green-600 shadow-sm'
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
                <option value="planName">{t('plan_name') || 'Sort by Name'}</option>
                <option value="planCode">{t('plan_code') || 'Sort by Code'}</option>
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
              onClick={handleExportPlans}
              disabled={isExporting || plans.length === 0}
              className="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="mr-2 size-4" />
              {isExporting ? (t('exporting') || 'Exporting...') : (t('export') || 'Export')}
            </button>

            {/* Import button */}
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-emerald-600"
            >
              <Upload className="mr-2 size-4" />
              {t('import') || 'Import'}
            </button>

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

      {/* Export Error Display */}
      {exportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-700">
            {t('export_failed') || 'Export failed'}
            :
            {exportError}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              {t('dismiss') || 'Dismiss'}
            </button>
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {search && (
        <div className="text-sm text-gray-600">
          {t('search_results_for') || 'Search results for'}
          {' '}
          "
          {search}
          "
        </div>
      )}

      {/* Plans Display */}
      {viewMode === 'card'
        ? (
            /* Card View */
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {plans.map(plan => (
                <div key={plan.id} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  {/* Card Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Plan Icon */}
                      <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
                        <CalendarDays className="size-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold text-gray-900">{plan.planName}</h3>
                        <p className="truncate font-mono text-sm text-gray-500">
                          {plan.planCode}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {plan.status && (
                      <div className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                        <CheckCircle className="mr-1 size-3" />
                        {plan.status}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="mb-4 space-y-3">
                    {/* Plan Year & Month */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="mr-2 size-4 text-green-500" />
                        <span className="font-medium">Period:</span>
                        <span className="ml-1">
                          {plan.planMonth}
                          /
                          {plan.planYear}
                        </span>
                      </div>
                    </div>

                    {/* Target vs Actual Quantities */}
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <Target className="mr-1 size-4 text-blue-500" />
                          <span>
                            Target:
                            {plan.totalTargetQuantity || 0}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="mr-1 size-4 text-green-500" />
                          <span>
                            Actual:
                            {plan.totalActualQuantity || 0}
                          </span>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      {plan.totalTargetQuantity && plan.totalTargetQuantity > 0 && (
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
                            style={{
                              width: `${Math.min(100, ((plan.totalActualQuantity || 0) / plan.totalTargetQuantity) * 100)}%`,
                            }}
                          >
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Approved By */}
                    {plan.approvedBy && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="mr-2 size-4 text-green-500" />
                        <span className="font-medium">Approved by:</span>
                        <span className="ml-1">{plan.approvedBy}</span>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="mr-1 size-3" />
                        Created:
                        {' '}
                        {formatDate(plan.createdAt)}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 size-3" />
                        Updated:
                        {' '}
                        {formatDate(plan.updatedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex justify-end space-x-2 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => onEdit(plan)}
                      disabled={isDeleting}
                      className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-green-600 transition-all duration-200 hover:bg-green-50 hover:text-green-800"
                    >
                      <Edit className="mr-1 size-4" />
                      {t('edit') || 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(plan)}
                      disabled={isDeleting}
                      className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800"
                    >
                      <Trash2 className="mr-1 size-4" />
                      {t('delete') || 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        : (
      /* List View */
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              {/* List Header */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <div className="col-span-3">Plan Details</div>
                  <div className="col-span-2">Period</div>
                  <div className="col-span-2">Progress</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* List Items */}
              <div className="divide-y divide-gray-100">
                {plans.map(plan => (
                  <div key={plan.id} className="px-6 py-4 transition-colors duration-150 hover:bg-gray-50">
                    <div className="grid grid-cols-12 items-center gap-4">
                      {/* Plan Details */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
                            <CalendarDays className="size-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{plan.planName}</p>
                            <p className="truncate font-mono text-xs text-gray-500">{plan.planCode}</p>
                          </div>
                        </div>
                      </div>

                      {/* Period */}
                      <div className="col-span-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="mr-1 size-3 text-green-500" />
                          {plan.planMonth}
                          /
                          {plan.planYear}
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <div className="mb-1 flex justify-between text-xs text-gray-600">
                              <span>{plan.totalActualQuantity || 0}</span>
                              <span>{plan.totalTargetQuantity || 0}</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-gray-200">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                                style={{
                                  width: `${plan.totalTargetQuantity && plan.totalTargetQuantity > 0 ? Math.min(100, ((plan.totalActualQuantity || 0) / plan.totalTargetQuantity) * 100) : 0}%`,
                                }}
                              >
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        {plan.status
                          ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                <CheckCircle className="mr-1 size-3" />
                                {plan.status}
                              </span>
                            )
                          : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                      </div>

                      {/* Created Date */}
                      <div className="col-span-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="mr-1 size-3" />
                          {formatDate(plan.createdAt)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => onEdit(plan)}
                            disabled={isDeleting}
                            className="rounded p-1 text-green-600 transition-all duration-200 hover:bg-green-50 hover:text-green-800"
                            title={t('edit') || 'Edit'}
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(plan)}
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
                ))}
              </div>
            </div>
          )}

      {/* Pagination */}
      {!showAll && pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between pt-4 text-sm">
          <span>
            {t('showing') || 'Showing'}
            {' '}
            {plans.length}
            {' '}
            {t('of') || 'of'}
            {' '}
            {pagination.total}
            {' '}
            {t('plans') || 'plans'}
            {pagination.page && ` • ${t('page') || 'Page'} ${pagination.page}`}
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
      {deleteConfirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm duration-300 animate-in fade-in">
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-300 animate-in zoom-in-95">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="size-8 text-red-600" />
              </div>

              {/* Title & Content */}
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{t('confirm_deletion') || 'Confirm Deletion'}</h3>

              {/* Plan preview */}
              <div className="mb-4 rounded-lg bg-gray-50 p-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
                    <CalendarDays className="size-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{deleteConfirmPlan.planName}</h4>
                    <p className="font-mono text-sm text-gray-500">{deleteConfirmPlan.planCode}</p>
                    {deleteConfirmPlan.status && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        {deleteConfirmPlan.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                {t('delete_confirm_message', { name: deleteConfirmPlan.planName }) || 'Are you sure you want to delete this plan? This action cannot be undone.'}
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

      {/* Import Modal */}
      <PlanImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
