/**
 * useEmployeeSalaryEntryImport Hook
 * Manages employeeSalaryEntry import functionality
 * Following exact same pattern as useEmployeeSalaryEntryMutations
 */

import { useCallback, useState } from 'react';

import type { ImportResult } from '@/types/import';

type ImportState = {
  isImporting: boolean;
  importError: string | null;
  importResult: ImportResult | null;
};

type ImportReturn = ImportState & {
  importEmployeeSalaryEntrys: (file: File) => Promise<ImportResult>;
  clearError: () => void;
  clearResult: () => void;
};

export function useEmployeeSalaryEntryImport(): ImportReturn {
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

  const importEmployeeSalaryEntrys = useCallback(async (file: File): Promise<ImportResult> => {
    setState(prev => ({ ...prev, isImporting: true, importError: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/employeeSalaryEntrys/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to import employeeSalaryEntrys';
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to import employeeSalaryEntrys';
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
    importEmployeeSalaryEntrys,
    clearError,
    clearResult,
  };
}
