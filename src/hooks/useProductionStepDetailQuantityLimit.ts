/**
 * Hook to fetch production step detail quantity limit
 * Based on selected product and production step combination
 */

import { useCallback, useState } from 'react';

export type ProductionStepDetailQuantityLimit = {
  quantityLimit1: number | null;
  quantityLimit2: number | null;
  effectiveLimit: number | null; // The actual limit to use (quantityLimit1 by default)
};

export const useProductionStepDetailQuantityLimit = () => {
  const [quantityLimit, setQuantityLimit] = useState<ProductionStepDetailQuantityLimit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuantityLimit = useCallback(async (productionStepDetailId: number) => {
    if (!productionStepDetailId) {
      setQuantityLimit(null);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/production-step-details/quantity-limit?productionStepDetailId=${productionStepDetailId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quantity limit: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const limit: ProductionStepDetailQuantityLimit = {
          quantityLimit1: data.data.quantityLimit1,
          quantityLimit2: data.data.quantityLimit2,
          effectiveLimit: data.data.quantityLimit1 || data.data.quantityLimit2 || null,
        };
        
        setQuantityLimit(limit);
        return limit;
      } else {
        throw new Error(data.error || 'No quantity limit data found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setQuantityLimit(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetQuantityLimit = useCallback(() => {
    setQuantityLimit(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    quantityLimit,
    isLoading,
    error,
    fetchQuantityLimit,
    resetQuantityLimit,
  };
};