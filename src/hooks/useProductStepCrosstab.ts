import { useCallback, useEffect, useState } from 'react';

import { fetchProductStepCrosstab } from '@/libs/api/productStepCrosstab';
import type {
  PriceType,
  ProductStepCrosstabResult,
} from '@/types/productStepCrosstab';

type CrosstabResponse = {
  data: ProductStepCrosstabResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CrosstabState = {
  data: ProductStepCrosstabResult[];
  pagination: CrosstabResponse['pagination'] | null;
  isLoading: boolean;
  error: string | null;
};

type CrosstabParams = {
  page?: number;
  limit?: number;
  search?: string;
  productCode?: string;
  priceType?: PriceType;
  showAll?: boolean;
};

type CrosstabReturn = CrosstabState & {
  refresh: () => void;
  handleExport: () => Promise<void>;
  isExporting: boolean;
};

const DEFAULT_PARAMS: Required<
  Omit<CrosstabParams, 'search' | 'productCode'>
> &
Pick<CrosstabParams, 'search' | 'productCode'> = {
  page: 1,
  limit: 10,
  priceType: 'calculated',
  search: undefined,
  productCode: undefined,
  showAll: false,
};

export function useProductStepCrosstab(params?: CrosstabParams): CrosstabReturn {
  const [state, setState] = useState<CrosstabState>({
    data: [],
    pagination: null,
    isLoading: false,
    error: null,
  });
  const [isExporting, setIsExporting] = useState(false);

  const page = params?.page ?? DEFAULT_PARAMS.page;
  const limit = params?.limit ?? DEFAULT_PARAMS.limit;
  const search = params?.search;
  const productCode = params?.productCode;
  const priceType = params?.priceType ?? DEFAULT_PARAMS.priceType;
  const showAll = params?.showAll ?? DEFAULT_PARAMS.showAll;

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const effectiveParams = {
        page,
        limit,
        search,
        productCode,
        priceType,
        showAll,
      };
      const response = await fetchProductStepCrosstab(effectiveParams);

      setState({
        data: response.data,
        pagination: response.pagination || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch crosstab data',
        data: [],
        pagination: null,
      }));
    }
  }, [page, limit, search, productCode, priceType, showAll]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportParams = new URLSearchParams({
        priceType,
        ...(search && { search }),
        ...(productCode && { productCode }),
      });

      const response = await fetch(
        `/api/product-step-crosstab/export?${exportParams.toString()}`,
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_step_crosstab.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // TODO: Show error toast
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refresh,
    handleExport,
    isExporting,
  };
}
