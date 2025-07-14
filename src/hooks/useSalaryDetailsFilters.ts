import { useState, useCallback } from 'react';
import { SalaryDetailsFilters } from '@/types/salaryDetails';

const today = new Date();
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

export function useSalaryDetailsFilters() {
  const [filters, setFilters] = useState<SalaryDetailsFilters>({
    search: '',
    userIds: [],
    startDate: firstDayOfMonth.toISOString().split('T')[0]!,
    endDate: today.toISOString().split('T')[0]!,
    sortBy: 'work_date',
    sortOrder: 'desc',
    showAll: false,
  });

  const updateFilter = useCallback(<K extends keyof SalaryDetailsFilters>(
    key: K,
    value: SalaryDetailsFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      userIds: [],
      startDate: firstDayOfMonth.toISOString().split('T')[0]!,
      endDate: today.toISOString().split('T')[0]!,
      sortBy: 'work_date',
      sortOrder: 'desc',
      showAll: false,
    });
  }, []);

  const toggleSort = useCallback((field: SalaryDetailsFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  return {
    filters,
    updateFilter,
    clearFilters,
    toggleSort,
  };
}