/**
 * useSalaryDetailsExport Hook
 * Manages salary details export functionality
 * Following established patterns from other export hooks
 */

import { useCallback, useState } from 'react';

type SalaryDetailsExportParams = {
  search?: string;
  userIds?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
  showAll?: boolean;
};

type ExportState = {
  isExporting: boolean;
  exportError: string | null;
  lastExportDate: Date | null;
};

type ExportReturn = ExportState & {
  exportSalaryDetails: (params?: SalaryDetailsExportParams) => Promise<void>;
  clearError: () => void;
};

export function useSalaryDetailsExport(): ExportReturn {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    exportError: null,
    lastExportDate: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, exportError: null }));
  }, []);

  const exportSalaryDetails = useCallback(async (params?: SalaryDetailsExportParams): Promise<void> => {
    setState(prev => ({ ...prev, isExporting: true, exportError: null }));

    try {
      // Build query parameters
      const searchParams = new URLSearchParams();

      if (params?.search) {
        searchParams.append('search', params.search);
      }
      if (params?.userIds) {
        searchParams.append('userIds', params.userIds);
      }
      if (params?.startDate) {
        searchParams.append('startDate', params.startDate);
      }
      if (params?.endDate) {
        searchParams.append('endDate', params.endDate);
      }
      if (params?.sortBy) {
        searchParams.append('sortBy', params.sortBy);
      }
      if (params?.sortOrder) {
        searchParams.append('sortOrder', params.sortOrder);
      }
      if (params?.showAll !== undefined) {
        searchParams.append('showAll', params.showAll.toString());
      }

      // Fetch export data
      const response = await fetch(`/api/salary-details/export?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        // Try to get error details from JSON response
        let errorMessage = 'Failed to export salary details';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Export failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `salary-details-export-${Date.now()}.xlsx`;

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

      setState(prev => ({
        ...prev,
        isExporting: false,
        exportError: null,
        lastExportDate: new Date(),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export salary details';
      setState(prev => ({
        ...prev,
        isExporting: false,
        exportError: errorMessage,
      }));
      throw error; // Re-throw for component-level error handling
    }
  }, []);

  return {
    ...state,
    exportSalaryDetails,
    clearError,
  };
}
