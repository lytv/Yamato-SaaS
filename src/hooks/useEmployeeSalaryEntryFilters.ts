/**
 * useEmployeeSalaryEntryFilters Hook
 * Enhanced version with advanced filtering capabilities
 * Supports date range, employee search, product search, and production step filtering
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import type { EmployeeSalaryEntryFilters } from '@/types/employeeSalaryEntry';

type EmployeeSalaryEntryFiltersReturn = EmployeeSalaryEntryFilters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: EmployeeSalaryEntryFilters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: EmployeeSalaryEntryFilters['sortOrder']) => void;

  // Enhanced filter handlers
  handleDateRangeChange: (from?: Date | string, to?: Date | string) => void;
  handleWorkDateRangeChange: (from?: Date | string, to?: Date | string) => void;
  handleEmployeeFilterChange: (userId?: string, employeeCode?: string, employeeName?: string) => void;
  handleProductFilterChange: (productId?: number, productCode?: string, productName?: string, productCategory?: string) => void;
  handleProductionStepFilterChange: (productionStepDetailId?: number, stepName?: string, filmSequence?: string) => void;
  handleStatusChange: (status?: EmployeeSalaryEntryFilters['status']) => void;
  handlePlanChange: (planId?: number) => void;

  resetFilters: () => void;
  resetAdvancedFilters: () => void;
  hasActiveFilters: boolean;
  hasAdvancedFilters: boolean;
};

const DEFAULT_FILTERS: EmployeeSalaryEntryFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useEmployeeSalaryEntryFilters(initialFilters?: Partial<EmployeeSalaryEntryFilters>): EmployeeSalaryEntryFiltersReturn {
  const [filters, setFilters] = useState<EmployeeSalaryEntryFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  // Basic handlers
  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: EmployeeSalaryEntryFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: EmployeeSalaryEntryFilters['sortOrder']) => {
    setFilters(prev => ({ ...prev, sortOrder }));
  }, []);

  const handleStatusChange = useCallback((status?: EmployeeSalaryEntryFilters['status']) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  // Enhanced filter handlers
  const handleDateRangeChange = useCallback((from?: Date | string, to?: Date | string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: from || to ? { from: from || '', to: to || '' } : undefined,
    }));
  }, []);

  const handleWorkDateRangeChange = useCallback((from?: Date | string, to?: Date | string) => {
    setFilters(prev => ({
      ...prev,
      workDateRange: from || to ? { from: from || '', to: to || '' } : undefined,
    }));
  }, []);

  const handleEmployeeFilterChange = useCallback((userId?: string, employeeCode?: string, employeeName?: string) => {
    setFilters(prev => ({
      ...prev,
      employee: userId || employeeCode || employeeName
        ? {
            userId,
            employeeCode,
            employeeName,
          }
        : undefined,
    }));
  }, []);

  const handleProductFilterChange = useCallback((productId?: number, productCode?: string, productName?: string, productCategory?: string) => {
    setFilters(prev => ({
      ...prev,
      product: productId || productCode || productName || productCategory
        ? {
            productId,
            productCode,
            productName,
            productCategory,
          }
        : undefined,
    }));
  }, []);

  const handleProductionStepFilterChange = useCallback((productionStepDetailId?: number, stepName?: string, filmSequence?: string) => {
    setFilters(prev => ({
      ...prev,
      productionStep: productionStepDetailId || stepName || filmSequence
        ? {
            productionStepDetailId,
            stepName,
            filmSequence,
          }
        : undefined,
    }));
  }, []);

  const handlePlanChange = useCallback((planId?: number) => {
    setFilters(prev => ({
      ...prev,
      relations: planId ? { planId } : undefined,
    }));
  }, []);

  // Reset handlers
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const resetAdvancedFilters = useCallback(() => {
    setFilters(prev => ({
      search: prev.search,
      sortBy: prev.sortBy,
      sortOrder: prev.sortOrder,
      // Clear all advanced filters
      status: undefined,
      dateRange: undefined,
      workDateRange: undefined,
      employee: undefined,
      product: undefined,
      productionStep: undefined,
      relations: undefined,
    }));
  }, []);

  // Helper computed properties
  const hasActiveFilters = !!(
    filters.search
    || filters.status
    || filters.dateRange
    || filters.workDateRange
    || filters.employee
    || filters.product
    || filters.productionStep
    || filters.relations
  );

  const hasAdvancedFilters = !!(
    filters.status
    || filters.dateRange
    || filters.workDateRange
    || filters.employee
    || filters.product
    || filters.productionStep
    || filters.relations
  );

  return {
    ...filters,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    handleDateRangeChange,
    handleWorkDateRangeChange,
    handleEmployeeFilterChange,
    handleProductFilterChange,
    handleProductionStepFilterChange,
    handleStatusChange,
    handlePlanChange,
    resetFilters,
    resetAdvancedFilters,
    hasActiveFilters,
    hasAdvancedFilters,
  };
}
