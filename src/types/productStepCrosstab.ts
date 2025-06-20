export type PriceType = 'factory' | 'calculated';

export type ProductStepCrosstabParams = {
  ownerId: string;
  productCode?: string;
  priceType?: 'factory' | 'calculated';
  search?: string;
  page?: number;
  limit?: number;
  showAll?: boolean;
};

export type ProductStepCrosstabResult = {
  productCode: string;
  productName: string;
  steps: {
    stepCode: string;
    stepName: string;
    price: string;
    sequenceNumber: number;
  }[];
};
