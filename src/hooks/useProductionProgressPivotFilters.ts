/**
 * Hook for managing production progress pivot filters
 * Following Yamato-SaaS patterns and TDD practices
 * Uses context for shared state between components
 */

import { useProductionProgressPivotContext } from '@/contexts/ProductionProgressPivotContext';
import type { UseProductionProgressPivotFiltersResult } from '@/types/productionProgressPivot';

export function useProductionProgressPivotFilters(): UseProductionProgressPivotFiltersResult {
  return useProductionProgressPivotContext();
}