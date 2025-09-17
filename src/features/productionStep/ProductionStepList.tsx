/**
 * ProductionStepList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays production steps in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Calendar, Download, Edit, FileText, Filter, GitBranch, Grid3X3, List, Search, Settings, Tag, Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

import { useProductionStepFilters } from '@/hooks/useProductionStepFilters';
import { useProductionStepMutations } from '@/hooks/useProductionStepMutations';
import { useProductionSteps } from '@/hooks/useProductionSteps';
import type { ProductionStep } from '@/types/productionStep';

import { ProductionStepImportModal } from './ProductionStepImportModal';

type ProductionStepListProps = {
  onEdit: (productionStep: ProductionStep) => void;
  onDelete: (productionStep: ProductionStep) => void;
};

export function ProductionStepList({ onEdit, onDelete }: ProductionStepListProps): JSX.Element {
  const t = useTranslations('productionStep.list');
  const { userId, orgId } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<ProductionStep | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchInput, setSearchInput] = useState('');

  // Filters & pagination
  const {
    search,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    resetFilters,
  } = useProductionStepFilters();

  const ownerId = orgId || userId || '';
  const [page, setPage] = useState(1);
  const { productionSteps, pagination, isLoading, error, refresh } = useProductionSteps({
    search,
    sortBy,
    sortOrder,
    page,
    limit: 10,
    ownerId,
  });
  const { deleteProductionStep, isDeleting } = useProductionStepMutations();

  // Đồng bộ searchInput với search filter hiện tại
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Handle manual search
  const handleManualSearch = () => {
    handleSearchChange(searchInput);
  };

  // Handle search input change (không trigger search ngay lập tức)
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
  };

  // Handle Enter key press for search
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleManualSearch();
    }
  };

  // Handle export
  const handleExport = async (): Promise<void> => {
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch('/api/production-steps/export', {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `production-steps-export-${Date.now()}.xlsx`;

      // Convert response to blob
      const blob = await response.blob();

      // Trigger file download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setExportError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle delete click
  const handleDeleteClick = (step: ProductionStep) => {
    setDeleteConfirmStep(step);
    setDeleteError(null);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmStep) {
      return;
    }
    try {
      await deleteProductionStep(deleteConfirmStep.id);
      onDelete(deleteConfirmStep);
      setDeleteConfirmStep(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete production step';
      setDeleteError(errorMessage);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteConfirmStep(null);
    setDeleteError(null);
  };

  // Handle import success
  const handleImportSuccess = () => {
    setIsImportOpen(false);
    refresh();
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput('');
    resetFilters();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">{t('loading')}</div>
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
  if (productionSteps.length === 0 && !search) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('empty_title')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('empty_desc')}</p>
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
                placeholder={t('search_placeholder')}
                value={searchInput}
                onChange={e => handleSearchInputChange(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                aria-label={t('search_placeholder')}
                className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-16 text-sm transition-all duration-200 placeholder:text-gray-500 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {/* Search Button */}
              <button
                type="button"
                onClick={handleManualSearch}
                className="absolute inset-y-0 right-0 flex items-center rounded-r-lg pr-3 transition-colors duration-200 hover:bg-indigo-50"
                title="Search"
              >
                <Search className="size-5 text-indigo-600 hover:text-indigo-800" />
              </button>
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
                    ? 'bg-white text-indigo-600 shadow-sm'
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
                    ? 'bg-white text-indigo-600 shadow-sm'
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
                onChange={e => handleSortChange(e.target.value as any)}
                className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0"
              >
                <option value="createdAt">{t('sort_createdAt')}</option>
                <option value="updatedAt">{t('sort_updatedAt')}</option>
                <option value="stepName">{t('sort_stepName')}</option>
                <option value="stepCode">{t('sort_stepCode')}</option>
                <option value="filmSequence">{t('sort_filmSequence')}</option>
              </select>
              <button
                type="button"
                onClick={() => handleSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-gray-500 transition-colors hover:text-gray-700"
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>

            {/* Export button */}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="mr-2 size-4" />
              {isExporting ? t('exporting') : t('export')}
            </button>

            {/* Import button */}
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-indigo-600"
            >
              <Upload className="mr-2 size-4" />
              {t('import')}
            </button>

            {/* Clear Search */}
            {(search || searchInput) && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-xs text-gray-500 underline hover:text-gray-700"
              >
                {t('reset')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Export Error Display */}
      {exportError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Export failed:
            {' '}
            {exportError}
            <button
              type="button"
              onClick={() => setExportError(null)}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Production Steps Display */}
      {viewMode === 'card'
        ? (
      /* Card View */
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {productionSteps.map(step => (
                <div key={step.id} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  {/* Card Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Step Icon */}
                      <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-blue-500">
                        <Settings className="size-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold text-gray-900">{step.stepName}</h3>
                        <p className="truncate font-mono text-sm text-gray-500">
                          {step.stepCode}
                        </p>
                      </div>
                    </div>

                    {/* Step Group Badge */}
                    {step.stepGroup && (
                      <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800">
                        <Tag className="mr-1 size-3" />
                        {step.stepGroup}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="mb-4 space-y-3">
                    {/* Film Sequence */}
                    {step.filmSequence && (
                      <div className="flex items-center text-sm text-gray-600">
                        <GitBranch className="mr-2 size-4 text-indigo-500" />
                        <span className="font-medium">Sequence:</span>
                        <span className="ml-1">{step.filmSequence}</span>
                      </div>
                    )}

                    {/* Notes */}
                    {step.notes && (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="flex items-start">
                          <FileText className="mr-2 mt-0.5 size-4 shrink-0 text-gray-500" />
                          <p className="line-clamp-2 text-sm text-gray-600">
                            {step.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="mr-1 size-3" />
                        Created:
                        {' '}
                        {new Date(step.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 size-3" />
                        Updated:
                        {' '}
                        {new Date(step.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex justify-end space-x-2 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => onEdit(step)}
                      className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-800"
                    >
                      <Edit className="mr-1 size-4" />
                      {t('edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(step)}
                      className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800"
                    >
                      <Trash2 className="mr-1 size-4" />
                      {t('delete')}
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
                  <div className="col-span-3">Production Step</div>
                  <div className="col-span-2">Step Group</div>
                  <div className="col-span-2">Film Sequence</div>
                  <div className="col-span-3">Notes</div>
                  <div className="col-span-1">Created</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              {/* List Items */}
              <div className="divide-y divide-gray-100">
                {productionSteps.map(step => (
                  <div key={step.id} className="px-6 py-4 transition-colors duration-150 hover:bg-gray-50">
                    <div className="grid grid-cols-12 items-center gap-4">
                      {/* Production Step Info */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-blue-500">
                            <Settings className="size-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{step.stepName}</p>
                            <p className="truncate font-mono text-xs text-gray-500">{step.stepCode}</p>
                          </div>
                        </div>
                      </div>

                      {/* Step Group */}
                      <div className="col-span-2">
                        {step.stepGroup
                          ? (
                              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800">
                                <Tag className="mr-1 size-3" />
                                {step.stepGroup}
                              </span>
                            )
                          : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                      </div>

                      {/* Film Sequence */}
                      <div className="col-span-2">
                        {step.filmSequence
                          ? (
                              <div className="flex items-center text-sm text-gray-600">
                                <GitBranch className="mr-1 size-3 text-indigo-500" />
                                {step.filmSequence}
                              </div>
                            )
                          : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                      </div>

                      {/* Notes */}
                      <div className="col-span-3">
                        {step.notes
                          ? (
                              <div className="flex items-center text-sm text-gray-600">
                                <FileText className="mr-1 size-3 text-gray-400" />
                                <span className="truncate">{step.notes}</span>
                              </div>
                            )
                          : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                      </div>

                      {/* Created Date */}
                      <div className="col-span-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="mr-1 size-3" />
                          {new Date(step.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => onEdit(step)}
                            className="rounded p-1 text-indigo-600 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-800"
                            title={t('edit')}
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(step)}
                            className="rounded p-1 text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-800"
                            title={t('delete')}
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
      {pagination && (
        <div className="flex items-center justify-between pt-4 text-sm">
          <span>
            {t('pagination.page')}
            {' '}
            {page}
            {' '}
            {t('pagination.of')}
            {' '}
            {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              className="rounded border px-2 py-1"
              disabled={page === 1}
            >
              {t('pagination.previous')}
            </button>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              className="rounded border px-2 py-1"
              disabled={!pagination.hasMore}
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm duration-300 animate-in fade-in">
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl duration-300 animate-in zoom-in-95">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="size-8 text-red-600" />
              </div>

              {/* Title & Content */}
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{t('delete_confirm_title')}</h3>

              {/* Production Step preview */}
              <div className="mb-4 rounded-lg bg-gray-50 p-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-blue-500">
                    <Settings className="size-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{deleteConfirmStep.stepName}</h4>
                    <p className="font-mono text-sm text-gray-500">{deleteConfirmStep.stepCode}</p>
                    {deleteConfirmStep.stepGroup && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800">
                        {deleteConfirmStep.stepGroup}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                {t('delete_confirm_desc', { stepCode: deleteConfirmStep.stepCode })}
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
                  {t('delete_cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="inline-flex flex-1 items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="mr-2 size-4" />
                  {isDeleting ? t('delete_deleting') : t('delete_confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ProductionStepImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
