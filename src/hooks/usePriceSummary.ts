/**
 * Price Summary Data Hook
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { useEffect, useState } from 'react';

import type {
  PriceSummaryErrorResponse,
  PriceSummaryFilters,
  PriceSummaryItem,
  PriceSummaryPagination,
  PriceSummaryResponse,
  PriceSummarySummary,
  UsePriceSummaryResult,
} from '@/types/priceSummary';
import { PRICE_SUMMARY_ENDPOINTS } from '@/types/priceSummary';

type UsePriceSummaryParams = PriceSummaryFilters & {
  enabled?: boolean;
};

export function usePriceSummary(params: UsePriceSummaryParams): UsePriceSummaryResult {
  const {
    search,
    product_code,
    price_type = 'factory_price',
    show_only_with_pricing = false,
    page = 1,
    limit = 20,
    sortBy = 'product_code',
    sortOrder = 'asc',
    enabled = true,
  } = params;

  const [data, setData] = useState<readonly PriceSummaryItem[]>([]);
  const [summary, setSummary] = useState<PriceSummarySummary>({
    total_records: 0,
    total_products: 0,
    total_steps_with_pricing: 0,
    average_price_per_product: 0,
    highest_priced_product: '',
    lowest_priced_product: '',
  });
  const [pagination, setPagination] = useState<PriceSummaryPagination>({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (search) {
        searchParams.append('search', search);
      }
      if (product_code) {
        searchParams.append('product_code', product_code);
      }
      if (price_type) {
        searchParams.append('price_type', price_type);
      }
      if (show_only_with_pricing !== undefined) {
        searchParams.append('show_only_with_pricing', show_only_with_pricing.toString());
      }
      if (page) {
        searchParams.append('page', page.toString());
      }
      if (limit) {
        searchParams.append('limit', limit.toString());
      }
      if (sortBy) {
        searchParams.append('sortBy', sortBy);
      }
      if (sortOrder) {
        searchParams.append('sortOrder', sortOrder);
      }

      const url = `${PRICE_SUMMARY_ENDPOINTS.LIST}?${searchParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const successResult = result as PriceSummaryResponse;
        setData(successResult.data);
        setSummary(successResult.summary);
        setPagination(successResult.pagination);
      } else {
        const errorResult = result as PriceSummaryErrorResponse;
        throw new Error(errorResult.error || 'Failed to fetch price summary data');
      }
    } catch (err) {
      console.error('Error fetching price summary:', err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));

      // Reset data on error
      setData([]);
      setSummary({
        total_records: 0,
        total_products: 0,
        total_steps_with_pricing: 0,
        average_price_per_product: 0,
        highest_priced_product: '',
        lowest_priced_product: '',
      });
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [fetchData, search, product_code, price_type, show_only_with_pricing, page, limit, sortBy, sortOrder, enabled]);

  return {
    data,
    summary,
    pagination,
    isLoading,
    isError,
    error,
    refetch,
  };
}
