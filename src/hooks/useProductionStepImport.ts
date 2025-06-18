/**
 * useProductionStepImport Hook
 * Manages production step import functionality
 * Following exact same pattern as useProductImport
 */

import { useCallback, useState } from 'react';

import type { ImportProductionStepResult } from '@/types/import';

type ImportState = {
  isImporting: boolean;
  importError: string | null;
  importResult: ImportProductionStepResult | null;
};

type ImportReturn = ImportState & {
  importProductionSteps: (file: File) => Promise<ImportProductionStepResult>;
  clearError: () => void;
  clearResult: () => void;
};

export function useProductionStepImport(): ImportReturn {
  const [state, setState] = useState<ImportState>({
    isImporting: false,
    importError: null,
    importResult: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, importError: null }));
  }, []);

  const clearResult = useCallback(() => {
    setState(prev => ({ ...prev, importResult: null }));
  }, []);

  const importProductionSteps = useCallback(async (file: File): Promise<ImportProductionStepResult> => {
    setState(prev => ({ ...prev, isImporting: true, importError: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/production-steps/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to import production steps';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Import failed with status ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const importResult = result.data;

      setState(prev => ({
        ...prev,
        isImporting: false,
        importResult,
      }));

      return importResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import production steps';
      setState(prev => ({
        ...prev,
        isImporting: false,
        importError: errorMessage,
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    importProductionSteps,
    clearError,
    clearResult,
  };
}
