/**
 * ProcessList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays processs in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download, Upload, Search, Filter, Settings, Edit, Trash2, FileText, Clock, Grid3X3, List, Cog } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

import { ProcessSkeleton } from '@/features/process/ProcessSkeleton';
import { useProcesses } from '@/hooks/useProcesses';
import { useProcessExport } from '@/hooks/useProcessExport';
import { useProcessFilters } from '@/hooks/useProcessFilters';
import { useProcessMutations } from '@/hooks/useProcessMutations';
import type { ImportResult } from '@/types/import';
import type { Process } from '@/types/process';

import { ProcessImportModal } from './ProcessImportModal';

type ProcessListProps = {
  onEdit: (process: Process) => void;
  onDelete: (process: Process) => void;
};

export function ProcessList({ onEdit, onDelete }: ProcessListProps): JSX.Element {
  const { userId, orgId } = useAuth();
  const t = useTranslations('process.list');
  const [deleteConfirmProcess, setDeleteConfirmProcess] = useState<Process | null>(null);
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
  } = useProcessFilters();

  // Get ownerId for multi-tenancy
  const ownerId = orgId || userId || '';

  const { processs, pagination, isLoading, error, refresh } = useProcesses({
    search,
    sortBy,
    sortOrder,
    page: showAll ? 1 : page,
    limit: 10,
    ownerId,
    showAll,
  });

  const { deleteProcess, isDeleting } = useProcessMutations();
  const { exportProcesss, isExporting, exportError, clearError } = useProcessExport();

  // Handle import success
  const handleImportSuccess = (_result: ImportResult) => {
    // Refresh process list
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
  const handleDeleteClick = (process: Process): void => {
    setDeleteConfirmProcess(process);
    setDeleteError(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteConfirmProcess) {
      return;
    }

    try {
      await deleteProcess(deleteConfirmProcess.id);
      onDelete(deleteConfirmProcess);
      setDeleteConfirmProcess(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete process';
      setDeleteError(errorMessage);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = (): void => {
    setDeleteConfirmProcess(null);
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

  // Handle export processs
  const handleExportProcesss = async (): Promise<void> => {
    try {
      await exportProcesss({
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
        <div role="status" aria-label="Loading processs" className="sr-only">
          Loading processs...
        </div>
        <ProcessSkeleton data-testid="process-list-skeleton" />
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
  if (processs.length === 0 && !search) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('no_process_found')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('create_first_process')}</p>
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
                placeholder={t('search_placeholder') || 'Search processes...'}
                value={search}
                onChange={handleSearchInputChange}
                aria-label={t('search_aria_label') || 'Search processes'}
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm placeholder:text-gray-500 focus:bg-white focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all duration-200"
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-600"></div>
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
                    ? 'bg-white text-slate-600 shadow-sm'
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
                    ? 'bg-white text-slate-600 shadow-sm'
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
                <option value="createdAt">{t('created_at') || 'Sort by Created'}</option>
                <option value="updatedAt">{t('updated_at') || 'Sort by Updated'}</option>
                <option value="processName">{t('process_name') || 'Sort by Name'}</option>
                <option value="processCode">{t('process_code') || 'Sort by Code'}</option>
                <option value="processCategory">{t('process_category') || 'Sort by Category'}</option>
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
              onClick={handleExportProcesss}
              disabled={isExporting || processs.length === 0}
              className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? (t('exporting') || 'Exporting...') : (t('export') || 'Export')}
            </button>

            {/* Import Button */}
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200 transform hover:scale-105"
            >
              <Upload className="mr-2 h-4 w-4" />
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
          {t('search_results_for', { search }) || `Search results for "${search}"`}
        </div>
      )}

      {/* Processes Display */}
      {viewMode === 'card' ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {processs.map((process) => (
            <div key={process.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {/* Process Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {process.processCode}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {process.processName}
                    </p>
                  </div>
                </div>
                
                {/* Category Badge */}
                {process.processCategory && (
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                    <Cog className="w-3 h-3 mr-1" />
                    {process.processCategory}
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="space-y-3 mb-4">
                {/* Process Info */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    {process.description && (
                      <div className="flex items-start text-gray-600">
                        <FileText className="w-4 h-4 mr-2 text-slate-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Description:</span>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{process.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Created: {formatDate(process.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Updated: {formatDate(process.updatedAt)}
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onEdit(process)}
                  disabled={isDeleting}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all duration-200"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {t('edit') || 'Edit'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(process)}
                  disabled={isDeleting}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t('delete') || 'Delete'}
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
              <div className="col-span-4">Process Info</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Dates</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-100">
            {processs.map((process) => (
              <div key={process.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Process Info */}
                  <div className="col-span-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Settings className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {process.processCode}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{process.processName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-span-2">
                    {process.processCategory ? (
                      <div className="inline-flex items-center text-sm text-gray-600">
                        <Cog className="w-3 h-3 mr-1 text-slate-500" />
                        {process.processCategory}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="col-span-3">
                    {process.description ? (
                      <div className="text-sm text-gray-600 truncate" title={process.description}>
                        {process.description}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>C: {formatDate(process.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>U: {formatDate(process.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1">
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => onEdit(process)}
                        disabled={isDeleting}
                        className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded transition-all duration-200"
                        title={t('edit') || 'Edit'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(process)}
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
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!showAll && pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between pt-4 text-sm">
          <span>
            {t('showing', { count: processs.length, total: pagination.total }) || `Showing ${processs.length} of ${pagination.total} processes`}
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
      {deleteConfirmProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative mx-4 w-full max-w-md transform rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              
              {/* Title & Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('confirm_deletion') || 'Confirm Deletion'}</h3>
              
              {/* Process preview */}
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-gray-500 rounded-full flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{deleteConfirmProcess.processCode}</h4>
                    <p className="text-sm text-gray-500">{deleteConfirmProcess.processName}</p>
                    {deleteConfirmProcess.processCategory && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 mt-1">
                        {deleteConfirmProcess.processCategory}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {t('delete_confirm_message', { name: deleteConfirmProcess.processName }) || 'Are you sure you want to delete this process? This action cannot be undone.'}
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

      {/* Import Modal */}
      <ProcessImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
