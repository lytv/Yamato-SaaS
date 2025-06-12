/**
 * useProductImport Hook
 * Manages product import functionality
 * Following exact same pattern as useProductMutations
 */

import { useCallback, useState } from 'react';

import type { ImportResult } from '@/types/import';

type ImportState = {
  isImporting: boolean;
  importError: string | null;
  importResult: ImportResult | null;
};

type ImportReturn = ImportState & {
  importProducts: (file: File) => Promise<ImportResult>;
  clearError: () => void;
  clearResult: () => void;
};

export function useProductImport(): ImportReturn {
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

  const importProducts = useCallback(async (file: File): Promise<ImportResult> => {
    setState(prev => ({ ...prev, isImporting: true, importError: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to import products';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to import products';
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
    importProducts,
    clearError,
    clearResult,
  };
}
