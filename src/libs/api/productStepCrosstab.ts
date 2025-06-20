import type {
  ProductStepCrosstabParams,
  ProductStepCrosstabResult,
} from '@/types/productStepCrosstab';

export type ProductStepCrosstabResponse = {
  data: ProductStepCrosstabResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function fetchProductStepCrosstab(
  params: Omit<ProductStepCrosstabParams, 'ownerId'>,
): Promise<ProductStepCrosstabResponse> {
  const query = new URLSearchParams({
    page: params.page?.toString() || '1',
    limit: params.limit?.toString() || '10',
    priceType: params.priceType || 'calculated',
    ...(params.search && { search: params.search }),
    ...(params.productCode && { productCode: params.productCode }),
    ...(params.showAll && { showAll: 'true' }),
  });

  const response = await fetch(`/api/product-step-crosstab?${query.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch product step crosstab data');
  }

  return response.json();
}

export async function fetchProductCodesForCrosstab(
  search?: string,
): Promise<string[]> {
  const query = new URLSearchParams(search ? { search } : {});
  const response = await fetch(
    `/api/product-step-crosstab/product-codes?${query.toString()}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch product codes for crosstab');
  }

  const result = await response.json();
  return result.data;
}
