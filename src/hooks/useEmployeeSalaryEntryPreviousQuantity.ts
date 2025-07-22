/**
 * Hook to fetch employee salary entry previous quantity
 * Based on selected plan, product, and production step detail combination
 */

import { useCallback, useState } from 'react';

export type EmployeeSalaryEntryPreviousQuantity = {
  planId: number;
  productId: number;
  productionStepDetailId: number;
  totalPreviousQuantity: number;
  excludedId: number | null;
};

export const useEmployeeSalaryEntryPreviousQuantity = () => {
  const [previousQuantity, setPreviousQuantity] = useState<EmployeeSalaryEntryPreviousQuantity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreviousQuantity = useCallback(async (
    planId: number, 
    productId: number, 
    productionStepDetailId: number,
    excludeId?: number
  ) => {
    if (!planId || !productId || !productionStepDetailId) {
      setPreviousQuantity(null);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        planId: planId.toString(),
        productId: productId.toString(),
        productionStepDetailId: productionStepDetailId.toString(),
      });

      if (excludeId) {
        params.append('excludeId', excludeId.toString());
      }

      const response = await fetch(
        `/api/employee-salary-entries/previous-quantity?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch previous quantity: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const previousData: EmployeeSalaryEntryPreviousQuantity = {
          planId: data.data.planId,
          productId: data.data.productId,
          productionStepDetailId: data.data.productionStepDetailId,
          totalPreviousQuantity: data.data.totalPreviousQuantity,
          excludedId: data.data.excludedId,
        };
        
        setPreviousQuantity(previousData);
        return previousData;
      } else {
        throw new Error(data.error || 'No previous quantity data found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setPreviousQuantity(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPreviousQuantity = useCallback(() => {
    setPreviousQuantity(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    previousQuantity,
    isLoading,
    error,
    fetchPreviousQuantity,
    resetPreviousQuantity,
  };
};