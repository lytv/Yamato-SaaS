/**
 * PlanDetailList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays plandetails in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download } from 'lucide-react';
import React, { useState, useEffect } from 'react';

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
  const [deleteConfirmPlanDetail, setDeleteConfirmPlanDetail] = useState<PlanDetail | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [relationOptions, setRelationOptions] = useState<{ products: { productCode: string; productName: string }[] }>({ products: [] });

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
          setRelationOptions({ products: data.data.products || [] });
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
      {/* Search and Filter Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-1 items-center space-x-4">
          <div className="relative max-w-lg flex-1">
            <input
              type="text"
              placeholder="Search plandetails..."
              value={search}
              onChange={handleSearchInputChange}
              aria-label="Search plandetails"
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
              <option value="plandetailName">PlanDetail Name</option>
              <option value="plandetailCode">PlanDetail Code</option>
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
            onClick={handleExportPlanDetails}
            disabled={isExporting || plandetails.length === 0}
            aria-label="Export plandetails to Excel"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="mr-2 size-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>

          {/* Import Modal/Button */}
          <PlanDetailImportModal onSuccess={handleImportSuccess} />

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
      {/* exportError && (
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
      )} */}

      {/* Search Results Info */}
      {search && (
        <div className="text-sm text-gray-600">
          Search results for "
          {search}
          "
        </div>
      )}

      {/* PlanDetail Count */}
      <div className="text-sm text-gray-600">
        Showing
        {' '}
        {plandetails.length}
        {' '}
        of
        {' '}
        {pagination?.total || 0}
        {' '}
        plandetails
        {pagination?.page && (
          <span>
            {' '}
            • Page
            {pagination.page}
          </span>
        )}
      </div>

      {/* PlanDetails Table */}
      <div className="overflow-x-auto">
        <table role="table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Product Sub Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Product Code
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Plan Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Planned Quantity
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {plandetails.map(plandetailRaw => {
              const plandetail = plandetailRaw as PlanDetailWithRelations;
              // Lấy productName từ relationOptions nếu có
              let productName = '-';
              if (plandetail.productCode && Array.isArray(relationOptions?.products)) {
                const found = relationOptions.products.find(p => p.productCode === plandetail.productCode);
                if (found) productName = found.productName;
              }
              return (
                <tr key={plandetail.id} className="hover:bg-gray-50">
                  {/* <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {plandetail.productSubCode}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {plandetail.productCode}
                  </td> */}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {plandetail.plan?.planCode || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {productName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {plandetail.plannedQuantity}
                  </td>
                  {/* <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {plandetail.status || '-'}
                  </td> */}
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => onEdit(plandetail)}
                        disabled={isDeleting}
                        className="text-indigo-600 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(plandetail)}
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
              {plandetails.length}
              {' '}
              of
              {' '}
              {pagination.total}
              {' '}
              plandetails
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
      {deleteConfirmPlanDetail && (
        <div className="fixed inset-0 z-50 size-full overflow-y-auto bg-gray-600/50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirm deletion</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "
                  {deleteConfirmPlanDetail.productCode}
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
    </div>
  );
}
