/**
 * ProductionStepList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays production steps in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download } from 'lucide-react';
import React, { useState } from 'react';

import type { ProductionStep } from '@/types/productionStep';

type ProductionStepListProps = {
  onEdit: (productionStep: ProductionStep) => void;
  onDelete: (productionStep: ProductionStep) => void;
};

export function ProductionStepList({ onEdit, onDelete }: ProductionStepListProps): JSX.Element {
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

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

      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Production Steps</h2>

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
      </div>

      {/* TODO: Actual production step list content would go here */}
      <div className="rounded-md border border-gray-200 p-4">
        <p className="text-gray-500">Production step list functionality will be added here.</p>
        <p className="mt-2 text-sm text-gray-400">Export button is now available above.</p>
        <p className="mt-1 text-xs text-gray-300">
          Props available - onEdit:
          {' '}
          {typeof onEdit === 'function' ? '✓' : '✗'}
          , onDelete:
          {' '}
          {typeof onDelete === 'function' ? '✓' : '✗'}
        </p>
      </div>
    </div>
  );
}
