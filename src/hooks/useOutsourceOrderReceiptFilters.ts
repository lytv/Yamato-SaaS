/**
 * OutsourceOrderReceipt filters management hook
 * Generated based on existing pattern from useOutsourceOrderDetailFilters
 */

import { useState, useCallback, useMemo } from 'react';

import type { OutsourceOrderReceiptFilters, OutsourceOrderReceiptListParams } from '@/types/outsourceOrderReceipt';

const defaultFilters: OutsourceOrderReceiptFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  outsourceOrderDetailId: undefined,
  qualityStatus: undefined,
  status: undefined,
  receivedByUserId: undefined,
  batchNumber: undefined,
  dateRange: undefined,
  relations: {},
};

export function useOutsourceOrderReceiptFilters(initialFilters?: Partial<OutsourceOrderReceiptFilters>) {
  const [filters, setFilters] = useState<OutsourceOrderReceiptFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  // Update individual filter
  const updateFilter = useCallback(<K extends keyof OutsourceOrderReceiptFilters>(
    key: K,
    value: OutsourceOrderReceiptFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters: Partial<OutsourceOrderReceiptFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters({ ...defaultFilters, ...initialFilters });
  }, [initialFilters]);

  // Clear specific filter
  const clearFilter = useCallback(<K extends keyof OutsourceOrderReceiptFilters>(key: K) => {
    setFilters(prev => ({
      ...prev,
      [key]: defaultFilters[key],
    }));
  }, []);

  // Convert filters to API parameters
  const toApiParams = useCallback((additionalParams?: Partial<OutsourceOrderReceiptListParams>): OutsourceOrderReceiptListParams => {
    const params: OutsourceOrderReceiptListParams = {
      search: filters.search || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      outsourceOrderDetailId: filters.outsourceOrderDetailId,
      qualityStatus: filters.qualityStatus,
      status: filters.status,
      receivedByUserId: filters.receivedByUserId,
      batchNumber: filters.batchNumber,
      ...additionalParams,
    };

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key as keyof OutsourceOrderReceiptListParams] === undefined) {
        delete params[key as keyof OutsourceOrderReceiptListParams];
      }
    });

    return params;
  }, [filters]);

  // Check if any filters are active (non-default)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== defaultFilters.search ||
      filters.outsourceOrderDetailId !== defaultFilters.outsourceOrderDetailId ||
      filters.qualityStatus !== defaultFilters.qualityStatus ||
      filters.status !== defaultFilters.status ||
      filters.receivedByUserId !== defaultFilters.receivedByUserId ||
      filters.batchNumber !== defaultFilters.batchNumber ||
      filters.dateRange !== defaultFilters.dateRange ||
      filters.sortBy !== defaultFilters.sortBy ||
      filters.sortOrder !== defaultFilters.sortOrder
    );
  }, [filters]);

  // Get count of active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search && filters.search !== defaultFilters.search) count++;
    if (filters.outsourceOrderDetailId !== defaultFilters.outsourceOrderDetailId) count++;
    if (filters.qualityStatus !== defaultFilters.qualityStatus) count++;
    if (filters.status !== defaultFilters.status) count++;
    if (filters.receivedByUserId !== defaultFilters.receivedByUserId) count++;
    if (filters.batchNumber !== defaultFilters.batchNumber) count++;
    if (filters.dateRange !== defaultFilters.dateRange) count++;
    return count;
  }, [filters]);

  // Quick filter functions
  const filterByQualityStatus = useCallback((qualityStatus?: string) => {
    updateFilter('qualityStatus', qualityStatus);
  }, [updateFilter]);

  const filterByStatus = useCallback((status?: string) => {
    updateFilter('status', status);
  }, [updateFilter]);

  const filterByDetailId = useCallback((outsourceOrderDetailId?: number) => {
    updateFilter('outsourceOrderDetailId', outsourceOrderDetailId);
  }, [updateFilter]);

  const filterByUser = useCallback((receivedByUserId?: string) => {
    updateFilter('receivedByUserId', receivedByUserId);
  }, [updateFilter]);

  const filterByBatch = useCallback((batchNumber?: string) => {
    updateFilter('batchNumber', batchNumber);
  }, [updateFilter]);

  const filterByDateRange = useCallback((dateRange?: { start: Date; end: Date }) => {
    updateFilter('dateRange', dateRange);
  }, [updateFilter]);

  // Search function
  const setSearch = useCallback((search: string) => {
    updateFilter('search', search);
  }, [updateFilter]);

  // Sorting functions
  const setSorting = useCallback((sortBy: OutsourceOrderReceiptFilters['sortBy'], sortOrder: OutsourceOrderReceiptFilters['sortOrder'] = 'desc') => {
    updateFilters({ sortBy, sortOrder });
  }, [updateFilters]);

  const toggleSortOrder = useCallback(() => {
    updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
  }, [filters.sortOrder, updateFilter]);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilter,
    toApiParams,
    hasActiveFilters,
    activeFiltersCount,
    
    // Quick actions
    filterByQualityStatus,
    filterByStatus,
    filterByDetailId,
    filterByUser,
    filterByBatch,
    filterByDateRange,
    setSearch,
    setSorting,
    toggleSortOrder,
  };
}
