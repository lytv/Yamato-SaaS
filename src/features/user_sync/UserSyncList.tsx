/**
 * UserSyncList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays user_syncs in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download, Upload } from 'lucide-react';
import React, { useState } from 'react';

import { UserSyncSkeleton } from '@/features/user_sync/UserSyncSkeleton';
import { useUserSyncExport } from '@/hooks/useUserSyncExport';
import { useUserSyncFilters } from '@/hooks/useUserSyncFilters';
import { useUserSyncMutations } from '@/hooks/useUserSyncMutations';
import { useUserSyncs } from '@/hooks/useUserSyncs';
import type { ImportResult } from '@/types/import';
import type { UserSync } from '@/types/user_sync';

import { UserSyncImportModal } from './UserSyncImportModal';

type UserSyncListProps = {
  onEdit: (user_sync: UserSync) => void;
  onDelete: (user_sync: UserSync) => void;
};

export function UserSyncList({ onEdit, onDelete }: UserSyncListProps): JSX.Element {
  const { userId, orgId } = useAuth();
  const [deleteConfirmUserSync, setDeleteConfirmUserSync] = useState<UserSync | null>(null);
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
  } = useUserSyncFilters();

  // Get ownerId for multi-tenancy
  const ownerId = orgId || userId || '';

  const { user_syncs, pagination, isLoading, error, refresh } = useUserSyncs({
    search,
    sortBy,
    sortOrder,
    page: showAll ? 1 : page,
    limit: 10,
    ownerId,
    showAll,
  });

  const { deleteUserSync, isDeleting } = useUserSyncMutations();
  const { exportUserSyncs, isExporting, exportError, clearError } = useUserSyncExport();

  // Handle import success
  const handleImportSuccess = (_result: ImportResult) => {
    // Refresh user_sync list
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
  const handleDeleteClick = (user_sync: UserSync): void => {
    setDeleteConfirmUserSync(user_sync);
    setDeleteError(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteConfirmUserSync) {
      return;
    }

    try {
      await deleteUserSync(deleteConfirmUserSync.userId, ownerId);
      onDelete(deleteConfirmUserSync);
      setDeleteConfirmUserSync(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user_sync';
      setDeleteError(errorMessage);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = (): void => {
    setDeleteConfirmUserSync(null);
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

  // Handle export user_syncs
  const handleExportUserSyncs = async (): Promise<void> => {
    try {
      await exportUserSyncs({
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
        <div role="status" aria-label="Loading user_syncs" className="sr-only">
          Loading user_syncs...
        </div>
        <UserSyncSkeleton data-testid="user_sync-list-skeleton" />
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
  if (user_syncs.length === 0 && !search) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No user_syncs found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create your first user_sync to get started.
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
              placeholder="Search user_syncs..."
              value={search}
              onChange={handleSearchInputChange}
              aria-label="Search user_syncs"
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
              <option value="user_syncName">UserSync Name</option>
              <option value="user_syncCode">UserSync Code</option>
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
            onClick={handleExportUserSyncs}
            disabled={isExporting || user_syncs.length === 0}
            aria-label="Export user_syncs to Excel"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="mr-2 size-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            aria-label="Import user_syncs from Excel"
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
              aria-label="Clear search"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear search
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

      {/* UserSync Count */}
      <div className="text-sm text-gray-600">
        Showing
        {' '}
        {user_syncs.length}
        {' '}
        of
        {' '}
        {pagination?.total || 0}
        {' '}
        user_syncs
        {pagination?.page && (
          <span>
            {' '}
            • Page
            {pagination.page}
          </span>
        )}
      </div>

      {/* UserSyncs Table */}
      <div className="overflow-x-auto">
        <table role="table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Avatar</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Org Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {user_syncs.map(user_sync => (
              <tr key={user_sync.userId} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{user_sync.userId}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{user_sync.email}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{user_sync.fullName || '-'}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {user_sync.avatarUrl
                    ? (
                        <img src={user_sync.avatarUrl} alt="avatar" className="size-8 rounded-full object-cover" />
                      )
                    : (
                        <span className="text-gray-400">-</span>
                      )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{user_sync.role || '-'}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{user_sync.organizationRole || '-'}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {user_sync.isActive
                    ? (
                        <span className="inline-block rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Active</span>
                      )
                    : (
                        <span className="inline-block rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">Inactive</span>
                      )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(user_sync.createdAt)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(user_sync.updatedAt)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => onEdit(user_sync)}
                      disabled={isDeleting}
                      className="text-indigo-600 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(user_sync)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
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
              {user_syncs.length}
              {' '}
              of
              {' '}
              {pagination.total}
              {' '}
              user_syncs
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
      {deleteConfirmUserSync && (
        <div className="fixed inset-0 z-50 size-full overflow-y-auto bg-gray-600/50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Confirm deletion</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "
                  {deleteConfirmUserSync.fullName || deleteConfirmUserSync.email}
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

      {/* Import Modal */}
      <UserSyncImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
