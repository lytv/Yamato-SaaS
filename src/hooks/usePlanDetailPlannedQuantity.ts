/**
 * Hook to fetch plan detail planned quantity
 * Based on selected plan and product combination
 */

import { useCallback, useState } from 'react';

export type PlanDetailPlannedQuantity = {
  planId: number;
  productId: number;
  productCode: string;
  totalPlannedQuantity: number;
  totalActualQuantity: number;
  remainingQuantity: number;
  details: Array<{
    id: number;
    planId: number;
    productCode: string;
    plannedQuantity: number | null;
    actualQuantity: number | null;
    locationCode: string | null;
    status: string | null;
  }>;
};

export const usePlanDetailPlannedQuantity = () => {
  const [plannedQuantity, setPlannedQuantity] = useState<PlanDetailPlannedQuantity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlannedQuantity = useCallback(async (planId: number, productId: number) => {
    if (!planId || !productId) {
      setPlannedQuantity(null);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/plan-details/planned-quantity?planId=${planId}&productId=${productId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch planned quantity: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const plannedData: PlanDetailPlannedQuantity = {
          planId: data.data.planId,
          productId: data.data.productId,
          productCode: data.data.productCode,
          totalPlannedQuantity: data.data.totalPlannedQuantity,
          totalActualQuantity: data.data.totalActualQuantity,
          remainingQuantity: data.data.remainingQuantity,
          details: data.data.details,
        };
        
        setPlannedQuantity(plannedData);
        return plannedData;
      } else {
        throw new Error(data.error || 'No planned quantity data found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setPlannedQuantity(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPlannedQuantity = useCallback(() => {
    setPlannedQuantity(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    plannedQuantity,
    isLoading,
    error,
    fetchPlannedQuantity,
    resetPlannedQuantity,
  };
};