/**
 * Satellite Progress Context Provider
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

'use client';

import React, { createContext, useContext, type ReactNode } from 'react';

import { useSatelliteProgress } from '@/hooks/useSatelliteProgress';
import { useSatelliteProgressFilters } from '@/hooks/useSatelliteProgressFilters';
import { useSatelliteProgressFilterOptions } from '@/hooks/useSatelliteProgressFilterOptions';
import { useSatelliteProgressExport } from '@/hooks/useSatelliteProgressExport';
import type {
  SatelliteProgressItem,
  SatelliteProgressSummary,
  SatelliteProgressPagination,
  SatelliteProgressFilterState,
  SatelliteProgressFilterOptions,
  SatelliteProgressExportParams,
} from '@/types/satelliteProgress';

// ✅ Context type definition
type SatelliteProgressContextValue = {
  // Data state
  data: readonly SatelliteProgressItem[];
  summary: SatelliteProgressSummary;
  pagination: SatelliteProgressPagination;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;

  // Filter state
  filters: SatelliteProgressFilterState;
  setFilters: (filters: Partial<SatelliteProgressFilterState>) => void;
  applyFilters: (filters: SatelliteProgressFilterState) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;

  // Filter options
  filterOptions: SatelliteProgressFilterOptions | undefined;
  isLoadingFilterOptions: boolean;
  filterOptionsError: Error | null;

  // Export functionality
  exportData: (params: SatelliteProgressExportParams) => Promise<void>;
  isExporting: boolean;
  exportError: Error | null;
  exportProgress: number;
};

// ✅ Create context with undefined default
const SatelliteProgressContext = createContext<SatelliteProgressContextValue | undefined>(undefined);

// ✅ Provider component props
type SatelliteProgressProviderProps = {
  children: ReactNode;
};

/**
 * Satellite Progress Context Provider Component
 * Provides satellite progress data, filters, and export functionality
 */
export function SatelliteProgressProvider({ children }: SatelliteProgressProviderProps): JSX.Element {
  // Filter management
  const {
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useSatelliteProgressFilters();

  // Data fetching
  const {
    data,
    summary,
    pagination,
    isLoading,
    isError,
    error,
    refetch,
  } = useSatelliteProgress(filters);

  // Filter options
  const {
    data: filterOptions,
    isLoading: isLoadingFilterOptions,
    error: filterOptionsError,
  } = useSatelliteProgressFilterOptions();

  // Export functionality
  const {
    exportData,
    isExporting,
    exportError,
    exportProgress,
  } = useSatelliteProgressExport();

  const contextValue: SatelliteProgressContextValue = {
    // Data state
    data,
    summary,
    pagination,
    isLoading,
    isError,
    error,
    refetch,

    // Filter state
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,

    // Filter options
    filterOptions,
    isLoadingFilterOptions,
    filterOptionsError,

    // Export functionality
    exportData,
    isExporting,
    exportError,
    exportProgress,
  };

  return (
    <SatelliteProgressContext.Provider value={contextValue}>
      {children}
    </SatelliteProgressContext.Provider>
  );
}

/**
 * Custom hook to use Satellite Progress Context
 * @returns Context value with all satellite progress functionality
 * @throws Error if used outside of SatelliteProgressProvider
 */
export function useSatelliteProgressContext(): SatelliteProgressContextValue {
  const context = useContext(SatelliteProgressContext);
  
  if (context === undefined) {
    throw new Error('useSatelliteProgressContext must be used within a SatelliteProgressProvider');
  }
  
  return context;
}

// ✅ Type export for external use
export type { SatelliteProgressContextValue };