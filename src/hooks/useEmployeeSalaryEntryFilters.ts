/**
 * useEmployeeSalaryEntryFilters Hook
 * Manages employeeSalaryEntry filtering and search state
 * Following TDD implementation and Yamato-SaaS patterns
 */

import { useCallback, useState } from 'react';

import type { EmployeeSalaryEntryFilters } from '@/types/employeeSalaryEntry';

type EmployeeSalaryEntryFiltersReturn = EmployeeSalaryEntryFilters & {
  handleSearchChange: (search: string) => void;
  handleSortChange: (sortBy: EmployeeSalaryEntryFilters['sortBy']) => void;
  handleSortOrderChange: (sortOrder: EmployeeSalaryEntryFilters['sortOrder']) => void;
  resetFilters: () => void;
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

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const handleSortChange = useCallback((sortBy: EmployeeSalaryEntryFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: EmployeeSalaryEntryFilters['sortOrder']) => {
    setFilters(prev => ({ ...prev, sortOrder }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    ...filters,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    resetFilters,
  };
}
