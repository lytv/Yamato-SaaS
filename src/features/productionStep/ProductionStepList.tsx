/**
 * ProductionStepList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays production steps in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download } from 'lucide-react';
import React, { useState } from 'react';

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
  const { userId, orgId } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<ProductionStep | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading production steps...</div>
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
  if (productionSteps.length === 0 && !search) {
    return (
      <div className="py-12 text-center">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No production steps found</h3>
        <p className="mt-1 text-sm text-gray-500">Create your first production step to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Error Display */}
      {exportError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{exportError}</p>
          <button
            type="button"
            onClick={() => setExportError(null)}
            className="text-sm text-red-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header with Export & Import Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Production Steps</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Export production steps to Excel"
          >
            <Download className="mr-2 size-4" />
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </button>
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center rounded-md border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
            title="Import production steps from Excel"
          >
            <span className="mr-2">📥</span>
            Import from Excel
          </button>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xs flex-1">
          <input
            type="text"
            placeholder="Search production steps..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            aria-label="Search production steps"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 leading-5 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sortBy" className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={e => handleSortChange(e.target.value as any)}
            className="rounded-md border-gray-300 py-1 pl-2 pr-6 text-sm"
          >
            <option value="createdAt">Created At</option>
            <option value="updatedAt">Updated At</option>
            <option value="stepName">Step Name</option>
            <option value="stepCode">Step Code</option>
            <option value="filmSequence">Film Sequence</option>
          </select>
          <button
            type="button"
            onClick={() => handleSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="rounded border px-2 py-1 text-xs"
            title="Toggle sort order"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="ml-2 text-xs text-gray-500 underline"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Step Code</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Step Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Film Sequence</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Step Group</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Notes</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Updated</th>
              <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {productionSteps.map(step => (
              <tr key={step.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2 font-mono text-sm">{step.stepCode}</td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">{step.stepName}</td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">{step.filmSequence || '-'}</td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">{step.stepGroup || '-'}</td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">{step.notes || '-'}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">{new Date(step.createdAt).toLocaleDateString()}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">{new Date(step.updatedAt).toLocaleDateString()}</td>
                <td className="whitespace-nowrap px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onEdit(step)}
                    className="mr-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(step)}
                    className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between pt-4 text-sm">
          <span>
            Page
            {' '}
            {page}
            {' '}
            of
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
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              className="rounded border px-2 py-1"
              disabled={!pagination.hasMore}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-medium text-gray-900">Confirm deletion</h3>
            <p className="mb-4 text-sm text-gray-600">
              Are you sure you want to delete production step
              {' '}
              <span className="font-mono font-semibold">{deleteConfirmStep.stepCode}</span>
              ? This action cannot be undone.
            </p>
            {deleteError && <div className="mb-2 text-sm text-red-600">{deleteError}</div>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="rounded border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
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
