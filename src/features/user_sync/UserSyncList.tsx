/**
 * UserSyncList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays user_syncs in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download, Edit, Eye, Filter, Search, Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

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
  const t = useTranslations('userSync.list');
  const [deleteConfirmUserSync, setDeleteConfirmUserSync] = useState<UserSync | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  // Temporary filter states for manual search
  const [tempSearch, setTempSearch] = useState('');
  const [tempShortcut, setTempShortcut] = useState('');
  const [tempFullName, setTempFullName] = useState('');

  const {
    search,
    sortBy,
    sortOrder,
    shortcut,
    fullName,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    handleShortcutChange,
    handleFullNameChange,
    resetFilters,
  } = useUserSyncFilters();

  // Sync temporary states with actual filters on mount
  useEffect(() => {
    setTempSearch(search);
    setTempShortcut(shortcut);
    setTempFullName(fullName);
  }, [search, shortcut, fullName]);

  // Handle manual search
  const handleSearch = (): void => {
    handleSearchChange(tempSearch);
    handleShortcutChange(tempShortcut);
    handleFullNameChange(tempFullName);
    setPage(1); // Reset to first page on new search
  };

  // Handle clear filters
  const handleClearFilters = (): void => {
    setTempSearch('');
    setTempShortcut('');
    setTempFullName('');
    resetFilters();
    setPage(1);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
    shortcut,
    fullName,
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

  // Handle search input change (now only updates temp state)
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setTempSearch(event.target.value);
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

  return (
    <div className="space-y-8 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Search and Filter Controls */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col space-y-4">
          {/* First Row: Search and Show All */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-1 items-center space-x-4">
              <div className="relative max-w-lg flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="size-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={tempSearch}
                  onChange={handleSearchInputChange}
                  onKeyPress={handleKeyPress}
                  aria-label={t('search_aria_label')}
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm transition-all duration-200 placeholder:text-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    id="showAll"
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
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Sort Controls */}
              <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-2">
                <Filter className="size-4 text-gray-500" />
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={handleSortFieldChange}
                  aria-label={t('sort_by')}
                  className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
                >
                  <option value="createdAt">{t('created_at')}</option>
                  <option value="updatedAt">{t('updated_at')}</option>
                  <option value="fullName">{t('full_name')}</option>
                  <option value="email">{t('email')}</option>
                </select>

                <button
                  type="button"
                  onClick={handleSortOrderToggle}
                  aria-label={t('sort_order')}
                  className="ml-2 p-1 text-gray-500 transition-colors duration-200 hover:text-gray-700"
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleExportUserSyncs}
                disabled={isExporting || user_syncs.length === 0}
                aria-label={t('export_aria_label')}
                className="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="mr-2 size-4" />
                {isExporting ? t('exporting') : t('export')}
              </button>

              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                aria-label={t('import_aria_label')}
                className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-blue-600"
              >
                <Upload className="mr-2 size-4" />
                {t('import')}
              </button>

              {/* Clear Filters */}
              {(search || shortcut || fullName) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  aria-label={t('clear_search_aria_label')}
                  className="inline-flex items-center rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-gray-600"
                >
                  {t('clear_filters')}
                </button>
              )}
            </div>
          </div>

          {/* Second Row: Exact Filters */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-x-4 lg:space-y-0">
            <div className="flex-1">
              <label htmlFor="shortcut-filter" className="mb-1 block text-sm font-medium text-gray-700">
                {t('filter_by_shortcut')}
              </label>
              <input
                type="text"
                id="shortcut-filter"
                placeholder={t('enter_shortcut_exact')}
                value={tempShortcut}
                onChange={e => setTempShortcut(e.target.value)}
                onKeyPress={handleKeyPress}
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm transition-all duration-200 placeholder:text-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="fullname-filter" className="mb-1 block text-sm font-medium text-gray-700">
                {t('filter_by_fullname')}
              </label>
              <input
                type="text"
                id="fullname-filter"
                placeholder={t('enter_fullname_exact')}
                value={tempFullName}
                onChange={e => setTempFullName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm transition-all duration-200 placeholder:text-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-blue-700"
              >
                <Search className="mr-2 size-4" />
                {t('search_button')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div>
          <div role="status" aria-label={t('loadingUsers')} className="sr-only">
            {t('loadingUsers')}
          </div>
          <UserSyncSkeleton data-testid="user_sync-list-skeleton" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-gray-100 bg-white py-12 text-center shadow-sm">
          <div className="mb-4 text-red-600">{error}</div>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Empty state without search */}
      {!isLoading && !error && user_syncs.length === 0 && !search && !shortcut && !fullName && (
        <div className="rounded-xl border border-gray-100 bg-white py-12 text-center shadow-sm">
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noUsersFound')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('createFirstUser')}
          </p>
        </div>
      )}

      {/* Export Error Display */}
      {exportError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">
            {t('exportFailed')}
            :
            {' '}
            {exportError}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {search && (
        <div className="text-sm text-gray-600">
          {t('searchResultsFor')}
          {' '}
          "
          {search}
          "
        </div>
      )}

      {/* UserSync Count */}
      {!isLoading && !error && user_syncs.length > 0 && (
        <div className="text-sm text-gray-600">
          {t('showing')}
          {' '}
          {user_syncs.length}
          {' '}
          {t('of')}
          {' '}
          {pagination?.total || 0}
          {' '}
          {t('users')}
          {pagination?.page && (
            <span>
              {' '}
              •
              {' '}
              {t('page')}
              {pagination.page}
            </span>
          )}
        </div>
      )}

      {/* UserSyncs Table/List View */}
      {!isLoading && !error && user_syncs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('full_name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('shortcut')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('role')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {user_syncs.map(user_sync => (
                  <tr key={user_sync.userId} className="transition-colors duration-150 hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="size-10 shrink-0">
                          {user_sync.avatarUrl
                            ? (
                                <img
                                  src={user_sync.avatarUrl}
                                  alt="avatar"
                                  className="size-10 rounded-full border-2 border-gray-200 object-cover"
                                />
                              )
                            : (
                                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                                  <span className="text-sm font-semibold text-white">
                                    {user_sync.fullName?.charAt(0) || user_sync.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user_sync.fullName || t('noName')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user_sync.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user_sync.shortcut
                        ? (
                            <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
                              {user_sync.shortcut}
                            </span>
                          )
                        : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        {user_sync.role && (
                          <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            {user_sync.role}
                          </span>
                        )}
                        {user_sync.organizationRole && (
                          <span className="inline-flex items-center rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                            {user_sync.organizationRole}
                          </span>
                        )}
                        {!user_sync.role && !user_sync.organizationRole && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => onEdit(user_sync)}
                        disabled={isDeleting}
                        className="mr-3 text-blue-600 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Edit className="inline size-4" />
                        <span className="ml-1">{t('edit')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(user_sync)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="inline size-4" />
                        <span className="ml-1">{t('delete')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && !showAll && pagination && pagination.total > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
            <div>
              <p className="flex items-center text-sm text-gray-700">
                <Eye className="mr-2 size-4 text-gray-400" />
                {t('showing')}
                {' '}
                <span className="mx-1 font-semibold">{user_syncs.length}</span>
                {' '}
                {t('of')}
                {' '}
                <span className="mx-1 font-semibold">{pagination.total}</span>
                {' '}
                {t('users')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ←
                {' '}
                {t('previous')}
              </button>
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-gray-900">
                {t('page')}
                {' '}
                {page}
              </span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={!pagination?.hasMore}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('next')}
                {' '}
                →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmUserSync && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm duration-300 animate-in fade-in">
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-300 animate-in zoom-in-95">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="size-8 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{t('confirmDeletion')}</h3>

              {/* Content */}
              <div className="mb-6">
                <p className="mb-4 text-sm text-gray-600">
                  {t('deleteConfirmMessage')}
                </p>

                {/* User Info */}
                <div className="rounded-lg bg-gray-50 p-4 text-left">
                  <div className="flex items-center space-x-3">
                    {deleteConfirmUserSync.avatarUrl
                      ? (
                          <img
                            src={deleteConfirmUserSync.avatarUrl}
                            alt="avatar"
                            className="size-10 rounded-full border-2 border-gray-200 object-cover"
                          />
                        )
                      : (
                          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                            <span className="font-semibold text-white">
                              {deleteConfirmUserSync.fullName?.charAt(0) || deleteConfirmUserSync.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {deleteConfirmUserSync.fullName || t('noName')}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {deleteConfirmUserSync.email}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs font-medium text-red-600">
                  {t('actionCannotBeUndone')}
                </p>

                {deleteError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-700">{deleteError}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting
                    ? (
                        <>
                          <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          {t('deleting')}
                        </>
                      )
                    : (
                        <>
                          <Trash2 className="mr-2 size-4" />
                          {t('confirmDelete')}
                        </>
                      )}
                </button>
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
