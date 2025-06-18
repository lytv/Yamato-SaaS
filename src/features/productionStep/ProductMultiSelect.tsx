'use client';

import React from 'react';

import { MultiSelectList } from '@/components/MultiSelectList';
import type { Product } from '@/types/product';

type ProductMultiSelectProps = {
  products: Product[];
  selected: Product[];
  onChange: (selected: Product[]) => void;
};

export function ProductMultiSelect({
  products,
  selected,
  onChange,
  page = 1,
  totalPages = 1,
  onPageChange,
}: ProductMultiSelectProps & { page?: number; totalPages?: number; onPageChange?: (page: number) => void }) {
  const filterFn = (product: Product, search: string) => {
    const s = search.toLowerCase();
    return (
      product.productName.toLowerCase().includes(s)
      || product.productCode.toLowerCase().includes(s)
      || (product.category?.toLowerCase().includes(s) ?? false)
    );
  };

  return (
    <div>
      <MultiSelectList<Product>
        items={products}
        selected={selected}
        onChange={onChange}
        getKey={p => p.id}
        renderItem={p => (
          <span className="flex-1">
            <span className="font-medium">{p.productName}</span>
            <span className="ml-2 text-xs text-gray-500">
              [
              {p.productCode}
              ]
            </span>
            {p.category && (
              <span className="ml-2 text-xs text-gray-400">
                (
                {p.category}
                )
              </span>
            )}
          </span>
        )}
        searchPlaceholder="Tìm kiếm sản phẩm..."
        filterFn={filterFn}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
