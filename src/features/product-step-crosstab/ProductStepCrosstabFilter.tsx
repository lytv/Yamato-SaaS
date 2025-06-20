'use client';

import { Download } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PriceType } from '@/types/productStepCrosstab';

import { PRICE_TYPE_OPTIONS } from '../../constants/productStepCrosstab';

type ProductStepCrosstabFilterProps = {
  productCode: string;
  onProductCodeChange: (value: string) => void;
  generalSearch: string;
  onGeneralSearchChange: (value: string) => void;
  priceType: PriceType;
  onPriceTypeChange: (value: PriceType) => void;
  onExport: () => void;
  isExporting: boolean;
  showAll: boolean;
  onShowAllChange: (value: boolean) => void;
};

export function ProductStepCrosstabFilter({
  productCode,
  onProductCodeChange,
  generalSearch,
  onGeneralSearchChange,
  priceType,
  onPriceTypeChange,
  onExport,
  isExporting,
  showAll,
  onShowAllChange,
}: ProductStepCrosstabFilterProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-4">
        <Input
          type="text"
          placeholder="Search Product Code..."
          value={productCode}
          onChange={e => onProductCodeChange(e.target.value)}
          className="max-w-sm"
        />
        <Input
          type="text"
          placeholder="Search Product Name/Code..."
          value={generalSearch}
          onChange={e => onGeneralSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={priceType}
          onChange={e => onPriceTypeChange(e.target.value as PriceType)}
          aria-label="Price Type"
          className="block w-full max-w-[180px] rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          {PRICE_TYPE_OPTIONS.map(
            (option: { value: PriceType; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ),
          )}
        </select>
        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="showAllCrosstab"
            checked={showAll}
            onChange={e => onShowAllChange(e.target.checked)}
            className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor="showAllCrosstab"
            className="text-sm font-medium text-gray-700"
          >
            Show All
          </label>
        </div>
      </div>

      <Button
        onClick={onExport}
        disabled={isExporting}
        aria-label="Export to Excel"
        variant="outline"
      >
        <Download className="mr-2 size-4" />
        {isExporting ? 'Exporting...' : 'Export to Excel'}
      </Button>
    </div>
  );
}
