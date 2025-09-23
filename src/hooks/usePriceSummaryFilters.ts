/**
 * Price Summary Filters Hook
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { useCallback, useMemo, useState } from 'react';

import type {
  PriceSummaryFilterState,
  PriceType,
  UsePriceSummaryFiltersResult,
} from '@/types/priceSummary';
import { PRICE_SUMMARY_DEFAULTS } from '@/types/priceSummary';

const initialFilterState: PriceSummaryFilterState = {
  search: '',
  product_code: '',
  price_type: PRICE_SUMMARY_DEFAULTS.PRICE_TYPE,
  show_only_with_pricing: PRICE_SUMMARY_DEFAULTS.SHOW_ONLY_WITH_PRICING,
  sortBy: PRICE_SUMMARY_DEFAULTS.SORT_BY,
  sortOrder: PRICE_SUMMARY_DEFAULTS.SORT_ORDER,
};

export function usePriceSummaryFilters(): UsePriceSummaryFiltersResult {
  const [filters, setFiltersState] = useState<PriceSummaryFilterState>(initialFilterState);

  const setFilters = useCallback((newFilters: Partial<PriceSummaryFilterState>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const applyFilters = useCallback((newFilters: PriceSummaryFilterState) => {
    setFiltersState(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilterState);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== initialFilterState.search
      || filters.product_code !== initialFilterState.product_code
      || filters.price_type !== initialFilterState.price_type
      || filters.show_only_with_pricing !== initialFilterState.show_only_with_pricing
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search !== initialFilterState.search && filters.search.trim() !== '') {
      count++;
    }
    if (filters.product_code !== initialFilterState.product_code && filters.product_code.trim() !== '') {
      count++;
    }
    if (filters.price_type !== initialFilterState.price_type) {
      count++;
    }
    if (filters.show_only_with_pricing !== initialFilterState.show_only_with_pricing) {
      count++;
    }
    return count;
  }, [filters]);

  return {
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}

/**
 * Hook for managing filter state with URL synchronization
 */
export function usePriceSummaryFiltersWithUrl(): UsePriceSummaryFiltersResult & {
  updateUrl: (filters: PriceSummaryFilterState) => void;
  loadFromUrl: () => PriceSummaryFilterState;
} {
  const baseHook = usePriceSummaryFilters();

  const updateUrl = useCallback((filters: PriceSummaryFilterState) => {
    if (typeof window === 'undefined') {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    // Update URL parameters
    if (filters.search && filters.search.trim() !== '') {
      searchParams.set('search', filters.search);
    } else {
      searchParams.delete('search');
    }

    if (filters.product_code && filters.product_code.trim() !== '') {
      searchParams.set('product_code', filters.product_code);
    } else {
      searchParams.delete('product_code');
    }

    if (filters.price_type !== PRICE_SUMMARY_DEFAULTS.PRICE_TYPE) {
      searchParams.set('price_type', filters.price_type);
    } else {
      searchParams.delete('price_type');
    }

    if (filters.show_only_with_pricing !== PRICE_SUMMARY_DEFAULTS.SHOW_ONLY_WITH_PRICING) {
      searchParams.set('show_only_with_pricing', filters.show_only_with_pricing.toString());
    } else {
      searchParams.delete('show_only_with_pricing');
    }

    if (filters.sortBy !== PRICE_SUMMARY_DEFAULTS.SORT_BY) {
      searchParams.set('sortBy', filters.sortBy);
    } else {
      searchParams.delete('sortBy');
    }

    if (filters.sortOrder !== PRICE_SUMMARY_DEFAULTS.SORT_ORDER) {
      searchParams.set('sortOrder', filters.sortOrder);
    } else {
      searchParams.delete('sortOrder');
    }

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, []);

  const loadFromUrl = useCallback((): PriceSummaryFilterState => {
    if (typeof window === 'undefined') {
      return initialFilterState;
    }

    const searchParams = new URLSearchParams(window.location.search);

    return {
      search: searchParams.get('search') || '',
      product_code: searchParams.get('product_code') || '',
      price_type: (searchParams.get('price_type') as PriceType) || PRICE_SUMMARY_DEFAULTS.PRICE_TYPE,
      show_only_with_pricing: searchParams.get('show_only_with_pricing') === 'true' || PRICE_SUMMARY_DEFAULTS.SHOW_ONLY_WITH_PRICING,
      sortBy: searchParams.get('sortBy') || PRICE_SUMMARY_DEFAULTS.SORT_BY,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || PRICE_SUMMARY_DEFAULTS.SORT_ORDER,
    };
  }, []);

  return {
    ...baseHook,
    updateUrl,
    loadFromUrl,
  };
}
