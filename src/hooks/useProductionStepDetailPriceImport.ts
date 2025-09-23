import { useState } from 'react';

export type PriceType = 'factory_price' | 'calculated_price' | 'retail_price';

export type ImportSummary = {
  processed: number;
  updated: number;
  created: number;
  errors: number;
};

export type ImportResult = {
  success: boolean;
  message?: string;
  summary: ImportSummary;
  errors?: string[];
};

export const useProductionStepDetailPriceImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const importPrices = async (file: File, priceType: PriceType): Promise<ImportResult> => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('priceType', priceType);

      const response = await fetch('/api/production-step-details/import-prices', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      setImportResult(result);
      return result;
    } catch (error) {
      const errorResult: ImportResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        summary: {
          processed: 0,
          updated: 0,
          created: 0,
          errors: 1,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      };

      setImportResult(errorResult);
      return errorResult;
    } finally {
      setIsImporting(false);
    }
  };

  const clearResult = () => {
    setImportResult(null);
  };

  return {
    importPrices,
    isImporting,
    importResult,
    clearResult,
  };
};
