import type { PriceType } from '@/types/productStepCrosstab';

export const PRICE_TYPE_OPTIONS: { value: PriceType; label: string }[] = [
  { value: 'calculated', label: 'Calculated Price' },
  { value: 'factory', label: 'Factory Price' },
];
