import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Search, Table, Edit, Trash2, Grid3X3, List, Settings, Clock, Wrench, BarChart3 } from 'lucide-react';

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
  sortBy: 'createdAt',
  sortOrder: 'desc',
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
    limit: 10,
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
    if (!deleteConfirmTable) return;
    
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
                placeholder={t('search_placeholder') || 'Search work tables...'}
                value={filters.search}
                onChange={e => handleSearchChange(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder:text-gray-500 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              />
            </div>
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
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-gray-600">Loading work tables...</span>
          </div>
        </div>
      )}

      {/* Work Tables Display */}
      {!isLoading && workTables.length > 0 && (
        <>
          {viewMode === 'card' ? (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {workTables.map((workTable) => (
                <div key={workTable.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {/* Work Table Icon */}
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center">
                        <Table className="w-6 h-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {workTable.tableCode}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {workTable.tableName}
                        </p>
                      </div>
                    </div>
                    
                    {/* Type Badge */}
                    {workTable.tableType && (
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        <Wrench className="w-3 h-3 mr-1" />
                        {workTable.tableType}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="space-y-3 mb-4">
                    {/* Table Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        {workTable.tableDetail && (
                          <div className="flex items-start text-gray-600">
                            <Settings className="w-4 h-4 mr-2 text-purple-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">Details:</span>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{workTable.tableDetail}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Created: {new Date(workTable.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Updated: {new Date(workTable.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                    {onView && (
                      <button
                        type="button"
                        onClick={() => onView(workTable)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        View
                      </button>
                    )}
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(workTable)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(workTable)}
                      disabled={isDeleting}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* List Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Table Info</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-3">Details</div>
                  <div className="col-span-2">Updated</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* List Items */}
              <div className="divide-y divide-gray-100">
                {workTables.map((workTable) => (
                  <div key={workTable.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Table Info */}
                      <div className="col-span-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Table className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {workTable.tableCode}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{workTable.tableName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Type */}
                      <div className="col-span-2">
                        {workTable.tableType ? (
                          <div className="inline-flex items-center text-sm text-gray-600">
                            <Wrench className="w-3 h-3 mr-1 text-purple-500" />
                            {workTable.tableType}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="col-span-3">
                        {workTable.tableDetail ? (
                          <div className="text-sm text-gray-600 truncate" title={workTable.tableDetail}>
                            {workTable.tableDetail}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>

                      {/* Updated */}
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
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
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all duration-200"
                              title="View"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(workTable)}
                              className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-all duration-200"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(workTable)}
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} work tables
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative mx-4 w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              
              {/* Title & Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
              
              {/* Work Table preview */}
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center">
                    <Table className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{deleteConfirmTable.tableCode}</h4>
                    <p className="text-sm text-gray-500">{deleteConfirmTable.tableName}</p>
                    {deleteConfirmTable.tableType && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                        {deleteConfirmTable.tableType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this work table? This action cannot be undone.
              </p>
              
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
    </div>
  );
}
