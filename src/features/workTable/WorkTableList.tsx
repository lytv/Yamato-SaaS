import { BarChart3, Clock, Edit, Grid3X3, List, Search, Settings, Table, Trash2, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useDeleteWorkTable } from '@/hooks/useWorkTableMutations';
import { useWorkTables } from '@/hooks/useWorkTables';
import type { WorkTable, WorkTableFilters } from '@/types/workTable';

type WorkTableListProps = {
  onEdit?: (workTable: WorkTable) => void;
  onView?: (workTable: WorkTable) => void;
};

const DEFAULT_FILTERS: WorkTableFilters = {
  search: '',
  sortBy: 'tableCode',
  sortOrder: 'asc',
  tableType: 'all',
  locationCode: '',
  tableCategory: 'all',
  assignedOperator: '',
  supervisor: '',
  capacityPerHourRange: [0, 100],
  utilizationRateRange: [0, 100],
  efficiencyRatingRange: [0, 100],
  maintenanceDue: false,
  warrantyExpiring: false,
};

export function WorkTableList({ onEdit, onView }: WorkTableListProps) {
  const t = useTranslations('workTable.list');
  const [filters, setFilters] = useState<WorkTableFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [deleteConfirmTable, setDeleteConfirmTable] = useState<WorkTable | null>(null);

  const { workTables, pagination, isLoading, error, refresh } = useWorkTables({
    page: currentPage,
    limit: 50, // Increased to show more tables
    search: filters.search || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const { deleteWorkTable, isLoading: isDeleting } = useDeleteWorkTable();

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleDeleteClick = (workTable: WorkTable): void => {
    setDeleteConfirmTable(workTable);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteConfirmTable) {
      return;
    }

    try {
      await deleteWorkTable(deleteConfirmTable.id);
      refresh();
      setDeleteConfirmTable(null);
    } catch (error) {
      console.error('Failed to delete work table:', error);
    }
  };

  const handleDeleteCancel = (): void => {
    setDeleteConfirmTable(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Error state
  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-red-600">{error}</div>
        <Button onClick={refresh} className="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (workTables.length === 0 && !filters.search && !isLoading) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No work tables found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create your first work table to get started.
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
                placeholder={t('search_placeholder') || 'Search work tables...'}
                value={filters.search}
                onChange={e => handleSearchChange(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm transition-all duration-200 placeholder:text-gray-500 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
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

            {/* Clear Search */}
            {filters.search && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="text-xs text-gray-500 underline hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="size-6 animate-spin rounded-full border-b-2 border-purple-600"></div>
            <span className="text-gray-600">Loading work tables...</span>
          </div>
        </div>
      )}

      {/* Work Tables Display */}
      {!isLoading && workTables.length > 0 && (
        <>
          {viewMode === 'card'
            ? (
          /* Card View */
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {workTables.map(workTable => (
                    <div key={workTable.id} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                      {/* Card Header */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Work Table Icon */}
                          <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-violet-500">
                            <Table className="size-6 text-white" />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-semibold text-gray-900">
                              {workTable.tableCode}
                            </h3>
                            <p className="truncate text-sm text-gray-500">
                              {workTable.tableName}
                            </p>
                          </div>
                        </div>

                        {/* Type Badge */}
                        {workTable.tableType && (
                          <div className="inline-flex items-center rounded-full border border-purple-200 bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800">
                            <Wrench className="mr-1 size-3" />
                            {workTable.tableType}
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="mb-4 space-y-3">
                        {/* Table Info */}
                        <div className="rounded-lg bg-gray-50 p-3">
                          <div className="grid grid-cols-1 gap-3 text-sm">
                            {workTable.tableDetail && (
                              <div className="flex items-start text-gray-600">
                                <Settings className="mr-2 mt-0.5 size-4 shrink-0 text-purple-500" />
                                <div>
                                  <span className="font-medium">Details:</span>
                                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">{workTable.tableDetail}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <Clock className="mr-1 size-3" />
                            Created:
                            {' '}
                            {new Date(workTable.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1 size-3" />
                            Updated:
                            {' '}
                            {new Date(workTable.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex justify-end space-x-2 border-t border-gray-100 pt-4">
                        {onView && (
                          <button
                            type="button"
                            onClick={() => onView(workTable)}
                            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-800"
                          >
                            <BarChart3 className="mr-1 size-4" />
                            View
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(workTable)}
                            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-purple-600 transition-all duration-200 hover:bg-purple-50 hover:text-purple-800"
                          >
                            <Edit className="mr-1 size-4" />
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(workTable)}
                          disabled={isDeleting}
                          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800"
                        >
                          <Trash2 className="mr-1 size-4" />
                          Delete
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
                      <div className="col-span-4">Table Info</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-3">Details</div>
                      <div className="col-span-2">Updated</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                  </div>

                  {/* List Items */}
                  <div className="divide-y divide-gray-100">
                    {workTables.map(workTable => (
                      <div key={workTable.id} className="px-6 py-4 transition-colors duration-150 hover:bg-gray-50">
                        <div className="grid grid-cols-12 items-center gap-4">
                          {/* Table Info */}
                          <div className="col-span-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-violet-500">
                                <Table className="size-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {workTable.tableCode}
                                </p>
                                <p className="truncate text-xs text-gray-500">{workTable.tableName}</p>
                              </div>
                            </div>
                          </div>

                          {/* Type */}
                          <div className="col-span-2">
                            {workTable.tableType
                              ? (
                                  <div className="inline-flex items-center text-sm text-gray-600">
                                    <Wrench className="mr-1 size-3 text-purple-500" />
                                    {workTable.tableType}
                                  </div>
                                )
                              : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                          </div>

                          {/* Details */}
                          <div className="col-span-3">
                            {workTable.tableDetail
                              ? (
                                  <div className="truncate text-sm text-gray-600" title={workTable.tableDetail}>
                                    {workTable.tableDetail}
                                  </div>
                                )
                              : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                          </div>

                          {/* Updated */}
                          <div className="col-span-2">
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center">
                                <Clock className="mr-1 size-3" />
                                <span>{new Date(workTable.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1">
                            <div className="flex items-center space-x-1">
                              {onView && (
                                <button
                                  type="button"
                                  onClick={() => onView(workTable)}
                                  className="rounded p-1 text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-800"
                                  title="View"
                                >
                                  <BarChart3 className="size-4" />
                                </button>
                              )}
                              {onEdit && (
                                <button
                                  type="button"
                                  onClick={() => onEdit(workTable)}
                                  className="rounded p-1 text-purple-600 transition-all duration-200 hover:bg-purple-50 hover:text-purple-800"
                                  title="Edit"
                                >
                                  <Edit className="size-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(workTable)}
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
                    ))}
                  </div>
                </div>
              )}
        </>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between pt-4 text-sm">
          <span>
            Showing
            {' '}
            {((pagination.page - 1) * pagination.limit) + 1}
            {' '}
            to
            {' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}
            {' '}
            of
            {' '}
            {pagination.total}
            {' '}
            work tables
            {pagination.page && ` • Page ${pagination.page}`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasMore}
              className="rounded border px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm duration-300 animate-in fade-in">
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-300 animate-in zoom-in-95">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="size-8 text-red-600" />
              </div>

              {/* Title & Content */}
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Confirm Deletion</h3>

              {/* Work Table preview */}
              <div className="mb-4 rounded-lg bg-gray-50 p-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-violet-500">
                    <Table className="size-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{deleteConfirmTable.tableCode}</h4>
                    <p className="text-sm text-gray-500">{deleteConfirmTable.tableName}</p>
                    {deleteConfirmTable.tableType && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                        {deleteConfirmTable.tableType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                Are you sure you want to delete this work table? This action cannot be undone.
              </p>

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
    </div>
  );
}
