/**
 * Custom hook for plan detail import functionality
 * Handles file upload and import processing for YMT Plan Excel files
 */

import { useState } from 'react';

type PlanDetailImportResult = {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  plandetails: any[];
};

type UsePlanDetailImportReturn = {
  importPlanDetails: (file: File) => Promise<PlanDetailImportResult>;
  isImporting: boolean;
  importResult: PlanDetailImportResult | null;
  clearImportResult: () => void;
};

export function usePlanDetailImport(): UsePlanDetailImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<PlanDetailImportResult | null>(null);

  const importPlanDetails = async (file: File): Promise<PlanDetailImportResult> => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/plandetails/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json() as PlanDetailImportResult;
      setImportResult(result);

      if (!response.ok) {
        throw new Error(result.errors?.join(', ') || 'Import failed');
      }

      return result;
    } catch (error) {
      const errorResult: PlanDetailImportResult = {
        success: false,
        imported: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Import failed'],
        plandetails: [],
      };

      setImportResult(errorResult);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const clearImportResult = () => {
    setImportResult(null);
  };

  return {
    importPlanDetails,
    isImporting,
    importResult,
    clearImportResult,
  };
}
