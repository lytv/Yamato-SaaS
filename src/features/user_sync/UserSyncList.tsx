/**
 * UserSyncList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays user_syncs in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download, Upload, Search, Filter, Edit, Trash2, Eye, UserCheck, UserX, Calendar, Mail, Building } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('userSync.list');
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
    <div className="space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl">
      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-1 items-center space-x-4">
            <div className="relative max-w-lg flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={handleSearchInputChange}
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

            {/* Clear Search */}
            {search && (
              <button
                type="button"
                onClick={resetFilters}
                aria-label={t('clear_search_aria_label')}
                className="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
              >
                {t('clear_search')}
              </button>
            )}
          </div>
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

      {/* UserSyncs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {user_syncs.map(user_sync => (
          <div key={user_sync.userId} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {user_sync.avatarUrl ? (
                    <img 
                      src={user_sync.avatarUrl} 
                      alt="avatar" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" 
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {user_sync.fullName?.charAt(0) || user_sync.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user_sync.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {user_sync.fullName || 'No Name'}
                  </h3>
                  <p className="text-sm text-gray-500 truncate flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    {user_sync.email}
                  </p>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="flex flex-col items-end space-y-1">
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  user_sync.isActive 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {user_sync.isActive ? (
                    <>
                      <UserCheck className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <UserX className="w-3 h-3 mr-1" />
                      Inactive
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="space-y-3 mb-4">
              {/* User ID */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">User ID</span>
                <code className="text-xs text-gray-700 bg-white px-2 py-1 rounded border">
                  {user_sync.userId.length > 20 ? `${user_sync.userId.substring(0, 20)}...` : user_sync.userId}
                </code>
              </div>

              {/* Roles */}
              {(user_sync.role || user_sync.organizationRole) && (
                <div className="flex flex-wrap gap-2">
                  {user_sync.role && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      <Building className="w-3 h-3 mr-1" />
                      {user_sync.role}
                    </span>
                  )}
                  {user_sync.organizationRole && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      <Building className="w-3 h-3 mr-1" />
                      {user_sync.organizationRole}
                    </span>
                  )}
                </div>
              )}

              {/* Shortcut */}
              {user_sync.shortcut && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500">Shortcut:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    {user_sync.shortcut}
                  </span>
                </div>
              )}

              {/* Dates */}
              <div className="flex justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Created: {formatDate(user_sync.createdAt)}
                </div>
                <div>
                  Updated: {formatDate(user_sync.updatedAt)}
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onEdit(user_sync)}
                disabled={isDeleting}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClick(user_sync)}
                disabled={isDeleting}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {!showAll && pagination && pagination.total > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <p className="text-sm text-gray-700 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-gray-400" />
                Showing <span className="font-semibold mx-1">{user_syncs.length}</span> of <span className="font-semibold mx-1">{pagination.total}</span> user_syncs
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
                Page {page}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
              
              {/* Content */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete this user sync?
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
                        {deleteConfirmUserSync.fullName || 'No Name'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {deleteConfirmUserSync.email}
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-red-600 mt-3 font-medium">
                  This action cannot be undone.
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
                  Cancel
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
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Confirm Delete
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
