/**
 * Satellite Progress Export Hook
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

import type {
  SatelliteProgressExportParams,
  UseSatelliteProgressExportResult,
} from '@/types/satelliteProgress';

/**
 * Custom hook for exporting satellite progress data
 * @returns Export functions and state
 */
export function useSatelliteProgressExport(): UseSatelliteProgressExportResult {
  const { userId } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<Error | null>(null);
  const [exportProgress, setExportProgress] = useState(0);

  const exportData = useCallback(async (params: SatelliteProgressExportParams) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setIsExporting(true);
    setExportError(null);
    setExportProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/satellite-progress/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to export satellite progress data');
      }

      // Create download link
      const blob = await fetch(result.downloadUrl).then(res => res.blob());
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Reset progress after successful download
      setTimeout(() => {
        setExportProgress(0);
      }, 1000);

    } catch (error) {
      setExportError(error as Error);
      setExportProgress(0);
    } finally {
      setIsExporting(false);
    }
  }, [userId]);

  return {
    exportData,
    isExporting,
    exportError,
    exportProgress,
  };
}