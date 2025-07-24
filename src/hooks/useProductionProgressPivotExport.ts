/**
 * Hook for exporting production progress pivot data
 * Following Yamato-SaaS patterns and TDD practices
 */

import { useCallback, useState } from 'react';

import type {
  ProductionProgressPivotExportParams,
  UseProductionProgressPivotExportResult,
} from '@/types/productionProgressPivot';

const EXPORT_URL = '/api/production-progress-pivot/export';

export function useProductionProgressPivotExport(): UseProductionProgressPivotExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<Error | null>(null);
  const [exportProgress, setExportProgress] = useState(0);

  const exportData = useCallback(async (params: ProductionProgressPivotExportParams) => {
    setIsExporting(true);
    setExportError(null);
    setExportProgress(0);

    try {
      const searchParams = new URLSearchParams();

      // Add non-empty parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });

      setExportProgress(25);

      const url = `${EXPORT_URL}?${searchParams.toString()}`;
      const response = await fetch(url);

      setExportProgress(50);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed: ${response.statusText}`);
      }

      setExportProgress(75);

      // Handle file download
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      
      let filename = params.filename || 'production_progress_pivot';
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Add extension if not present
      if (!filename.includes('.')) {
        filename += `.${params.format || 'xlsx'}`;
      }

      setExportProgress(90);

      // Create download link
      const url2 = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url2;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url2);

      setExportProgress(100);
    } catch (error) {
      console.error('Export error:', error);
      setExportError(error instanceof Error ? error : new Error('Export failed'));
    } finally {
      setIsExporting(false);
      // Reset progress after a delay
      setTimeout(() => setExportProgress(0), 1000);
    }
  }, []);

  return {
    exportData,
    isExporting,
    exportError,
    exportProgress,
  };
}