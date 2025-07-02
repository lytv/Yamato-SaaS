/**
 * useUserSyncExport Hook
 * Manages user_sync export functionality
 * Following TDD implementation and established hook patterns from useUserSyncs/useUserSyncMutations
 */

import { useCallback, useState } from 'react';

type ExportState = {
  isExporting: boolean;
  exportError: string | null;
  lastExportDate: Date | null;
};

type ExportReturn = ExportState & {
  exportUserSyncs: (params?: any) => Promise<void>;
  clearError: () => void;
};

export function useUserSyncExport(): ExportReturn {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    exportError: null,
    lastExportDate: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, exportError: null }));
  }, []);

  const exportUserSyncs = useCallback(async (params?: any): Promise<void> => {
    setState(prev => ({ ...prev, isExporting: true, exportError: null }));

    try {
      // Build query parameters
      const searchParams = new URLSearchParams();

      if (params?.search) {
        searchParams.append('search', params.search);
      }
      if (params?.sortBy) {
        searchParams.append('sortBy', params.sortBy);
      }
      if (params?.sortOrder) {
        searchParams.append('sortOrder', params.sortOrder);
      }

      // Fetch export data
      const response = await fetch(`/api/user_syncs/export?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        // Try to get error details from JSON response
        let errorMessage = 'Failed to export user_syncs';
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
      const filename = filenameMatch?.[1] || `user_syncs-export-${Date.now()}.xlsx`;

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to export user_syncs';
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
    exportUserSyncs,
    clearError,
  };
}
