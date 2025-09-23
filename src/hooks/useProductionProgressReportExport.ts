/**
 * Production Progress Report Export Hook
 * Following Yamato-SaaS patterns for export functionality
 */

import { useCallback, useState } from 'react';

import type {
  ProductionProgressReportExportParams,
  UseProductionProgressReportExportResult,
} from '@/types/productionProgressReport';

/**
 * Hook for exporting production progress report data
 * @returns Export function and state management
 */
export function useProductionProgressReportExport(): UseProductionProgressReportExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<Error | null>(null);
  const [exportProgress, setExportProgress] = useState(0);

  const exportData = useCallback(async (params: ProductionProgressReportExportParams) => {
    setIsExporting(true);
    setExportError(null);
    setExportProgress(0);

    try {
      const searchParams = new URLSearchParams();

      // Add export parameters to search params
      if (params.search) {
        searchParams.set('search', params.search);
      }
      if (params.plan_code) {
        searchParams.set('plan_code', params.plan_code);
      }
      if (params.product_code) {
        searchParams.set('product_code', params.product_code);
      }
      if (params.production_step_code) {
        searchParams.set('production_step_code', params.production_step_code);
      }
      if (params.report_type && params.report_type !== 'ALL') {
        searchParams.set('report_type', params.report_type);
      }
      if (params.format) {
        searchParams.set('format', params.format);
      }
      if (params.includeHeaders !== undefined) {
        searchParams.set('includeHeaders', params.includeHeaders.toString());
      }
      if (params.filename) {
        searchParams.set('filename', params.filename);
      }

      setExportProgress(25);

      const response = await fetch(`/api/production-progress-report/export?${searchParams.toString()}`);

      setExportProgress(50);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export production progress report');
      }

      setExportProgress(75);

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'production_progress_report';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportProgress(100);
    } catch (error) {
      console.error('Export error:', error);
      setExportError(error instanceof Error ? error : new Error('Export failed'));
    } finally {
      setIsExporting(false);
      // Reset progress after a short delay
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
