import { useState } from 'react';

import { importProductSubs } from '@/libs/api/productsubs';
import type { ImportResult } from '@/types/import';

export function useProductSubImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const importProductSubsHandler = async (file: File) => {
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const result = await importProductSubs(file);
      setImportResult(result);
      return result;
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
      return undefined;
    } finally {
      setIsImporting(false);
    }
  };

  const clearError = () => setImportError(null);
  const clearResult = () => setImportResult(null);

  return {
    importProductSubs: importProductSubsHandler,
    isImporting,
    importError,
    importResult,
    clearError,
    clearResult,
  };
}
