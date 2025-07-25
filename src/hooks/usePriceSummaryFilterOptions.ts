/**
 * Price Summary Filter Options Hook
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { useEffect, useState } from 'react';

import type {
  PriceSummaryFilterOptions,
  PriceSummaryFilterOptionsResponse,
  PriceSummaryErrorResponse,
} from '@/types/priceSummary';
import { PRICE_SUMMARY_ENDPOINTS } from '@/types/priceSummary';

type UsePriceSummaryFilterOptionsResult = {
  filterOptions: PriceSummaryFilterOptions;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

export function usePriceSummaryFilterOptions(): UsePriceSummaryFilterOptionsResult {
  const [filterOptions, setFilterOptions] = useState<PriceSummaryFilterOptions>({
    products: [],
    price_types: [],
    steps: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFilterOptions = async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const response = await fetch(PRICE_SUMMARY_ENDPOINTS.FILTER_OPTIONS);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const successResult = result as PriceSummaryFilterOptionsResponse;
        setFilterOptions(successResult.data);
      } else {
        const errorResult = result as PriceSummaryErrorResponse;
        throw new Error(errorResult.error || 'Failed to fetch filter options');
      }
    } catch (err) {
      console.error('Error fetching price summary filter options:', err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      
      // Reset data on error
      setFilterOptions({
        products: [],
        price_types: [],
        steps: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchFilterOptions();
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  return {
    filterOptions,
    isLoading,
    isError,
    error,
    refetch,
  };
}