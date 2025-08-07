/**
 * UserSyncList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays user_syncs in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download, Upload, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState, useEffect } from 'react';

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
    <div className="space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl">
      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col space-y-4">
          {/* First Row: Search and Show All */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-1 items-center space-x-4">
              <div className="relative max-w-lg flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={tempSearch}
                  onChange={handleSearchInputChange}
                  onKeyPress={handleKeyPress}
                  aria-label={t('search_aria_label')}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder:text-gray-500 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
              <div className="flex items-center space-x-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="showAll"
                    checked={showAll}
                    onChange={e => setShowAll(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {t('show_all')}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
            {/* Sort Controls */}
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                id="sortBy"
                value={sortBy}
                onChange={handleSortFieldChange}
                aria-label={t('sort_by')}
                className="bg-transparent border-0 text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
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
                className="ml-2 p-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
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
              className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? t('exporting') : t('export')}
            </button>

            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              aria-label={t('import_aria_label')}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200 transform hover:scale-105"
            >
              <Upload className="mr-2 h-4 w-4" />
              {t('import')}
            </button>

              {/* Clear Filters */}
              {(search || shortcut || fullName) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  aria-label={t('clear_search_aria_label')}
                  className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
                >
                  {t('clear_filters')}
                </button>
              )}
            </div>
          </div>

          {/* Second Row: Exact Filters */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-x-4 lg:space-y-0">
            <div className="flex-1">
              <label htmlFor="shortcut-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('filter_by_shortcut')}
              </label>
              <input
                type="text"
                id="shortcut-filter"
                placeholder={t('enter_shortcut_exact')}
                value={tempShortcut}
                onChange={e => setTempShortcut(e.target.value)}
                onKeyPress={handleKeyPress}
                className="block w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder:text-gray-500 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="fullname-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('filter_by_fullname')}
              </label>
              <input
                type="text"
                id="fullname-filter"
                placeholder={t('enter_fullname_exact')}
                value={tempFullName}
                onChange={e => setTempFullName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="block w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder:text-gray-500 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
            
            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-sm"
              >
                <Search className="w-4 h-4 mr-2" />
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
        <div className="py-12 text-center bg-white rounded-xl shadow-sm border border-gray-100">
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
        <div className="py-12 text-center bg-white rounded-xl shadow-sm border border-gray-100">
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
            {t('exportFailed')}:
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
          {t('searchResultsFor')} "
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
            • {t('page')}
            {pagination.page}
          </span>
        )}
      </div>
      )}

      {/* UserSyncs Table/List View */}
      {!isLoading && !error && user_syncs.length > 0 && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('full_name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('shortcut')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('role')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {user_syncs.map(user_sync => (
                <tr key={user_sync.userId} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user_sync.avatarUrl ? (
                          <img 
                            src={user_sync.avatarUrl} 
                            alt="avatar" 
                            className="h-10 w-10 rounded-full object-cover border-2 border-gray-200" 
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user_sync.shortcut ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        {user_sync.shortcut}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {user_sync.role && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {user_sync.role}
                        </span>
                      )}
                      {user_sync.organizationRole && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {user_sync.organizationRole}
                        </span>
                      )}
                      {!user_sync.role && !user_sync.organizationRole && (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => onEdit(user_sync)}
                      disabled={isDeleting}
                      className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit className="w-4 h-4 inline" />
                      <span className="ml-1">{t('edit')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(user_sync)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 inline" />
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <p className="text-sm text-gray-700 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-gray-400" />
                {t('showing')} <span className="font-semibold mx-1">{user_syncs.length}</span> {t('of')} <span className="font-semibold mx-1">{pagination.total}</span> {t('users')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              >
                ← {t('previous')}
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-900 bg-blue-50 border border-blue-200 rounded-lg">
                {t('page')} {page}
              </span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={!pagination?.hasMore}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              >
                {t('next')} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmUserSync && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative mx-4 w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('confirmDeletion')}</h3>
              
              {/* Content */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  {t('deleteConfirmMessage')}
                </p>
                
                {/* User Info */}
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <div className="flex items-center space-x-3">
                    {deleteConfirmUserSync.avatarUrl ? (
                      <img 
                        src={deleteConfirmUserSync.avatarUrl} 
                        alt="avatar" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" 
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {deleteConfirmUserSync.fullName?.charAt(0) || deleteConfirmUserSync.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {deleteConfirmUserSync.fullName || t('noName')}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {deleteConfirmUserSync.email}
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-red-600 mt-3 font-medium">
                  {t('actionCannotBeUndone')}
                </p>
                
                {deleteError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{deleteError}</p>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t('deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
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
