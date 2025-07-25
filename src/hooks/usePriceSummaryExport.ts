/**
 * Price Summary Export Hook
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { useState } from 'react';

import type {
  PriceSummaryExportParams,
  UsePriceSummaryExportResult,
  PriceSummaryErrorResponse,
} from '@/types/priceSummary';
import { PRICE_SUMMARY_ENDPOINTS } from '@/types/priceSummary';

export function usePriceSummaryExport(): UsePriceSummaryExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<Error | null>(null);
  const [exportProgress, setExportProgress] = useState(0);

  const exportData = async (params: PriceSummaryExportParams): Promise<void> => {
    setIsExporting(true);
    setExportError(null);
    setExportProgress(0);

    try {
      // Build query parameters
      const searchParams = new URLSearchParams();
      
      if (params.search) searchParams.append('search', params.search);
      if (params.product_code) searchParams.append('product_code', params.product_code);
      if (params.price_type) searchParams.append('price_type', params.price_type);
      if (params.show_only_with_pricing !== undefined) {
        searchParams.append('show_only_with_pricing', params.show_only_with_pricing.toString());
      }
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      if (params.format) searchParams.append('format', params.format);
      if (params.includeHeaders !== undefined) {
        searchParams.append('includeHeaders', params.includeHeaders.toString());
      }
      if (params.filename) searchParams.append('filename', params.filename);

      setExportProgress(25);

      const url = `${PRICE_SUMMARY_ENDPOINTS.EXPORT}?${searchParams.toString()}`;
      const response = await fetch(url);
      
      setExportProgress(50);

      if (!response.ok) {
        if (response.headers.get('content-type')?.includes('application/json')) {
          const errorResult = await response.json() as PriceSummaryErrorResponse;
          throw new Error(errorResult.error || 'Export failed');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      setExportProgress(75);

      // Handle file download
      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let filename = params.filename || 'price_summary_export';
      
      // Extract filename from Content-Disposition header if available
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      
      setExportProgress(100);
      
      // Show success message briefly
      setTimeout(() => {
        setExportProgress(0);
      }, 1000);

    } catch (err) {
      console.error('Error exporting price summary:', err);
      setExportError(err instanceof Error ? err : new Error('Unknown export error occurred'));
      setExportProgress(0);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting,
    exportError,
    exportProgress,
  };
}

/**
 * Hook for batch export operations
 */
export function usePriceSummaryBatchExport(): UsePriceSummaryExportResult & {
  exportMultiple: (exports: PriceSummaryExportParams[]) => Promise<void>;
  batchProgress: number;
} {
  const baseHook = usePriceSummaryExport();
  const [batchProgress, setBatchProgress] = useState(0);

  const exportMultiple = async (exports: PriceSummaryExportParams[]): Promise<void> => {
    if (exports.length === 0) return;

    setBatchProgress(0);
    
    try {
      for (let i = 0; i < exports.length; i++) {
        const exportParams = exports[i];
        if (exportParams) {
          await baseHook.exportData(exportParams);
        }
        
        // Update batch progress
        const progress = ((i + 1) / exports.length) * 100;
        setBatchProgress(progress);
        
        // Small delay between exports to prevent overwhelming the server
        if (i < exports.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Reset progress after completion
      setTimeout(() => {
        setBatchProgress(0);
      }, 2000);
      
    } catch (error) {
      setBatchProgress(0);
      throw error;
    }
  };

  return {
    ...baseHook,
    exportMultiple,
    batchProgress,
  };
}