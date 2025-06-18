'use client';

import React from 'react';

import { MultiSelectList } from '@/components/MultiSelectList';
import type { ProductionStep } from '@/types/productionStep';

type StepMultiSelectProps = {
  steps: ProductionStep[];
  selected: ProductionStep[];
  onChange: (selected: ProductionStep[]) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

export function StepMultiSelect({
  steps,
  selected,
  onChange,
  page = 1,
  totalPages = 1,
  onPageChange,
}: StepMultiSelectProps) {
  const filterFn = (step: ProductionStep, search: string) => {
    const s = search.toLowerCase();
    return (
      step.stepName.toLowerCase().includes(s)
      || step.stepCode.toLowerCase().includes(s)
      || (step.stepGroup?.toLowerCase().includes(s) ?? false)
    );
  };

  return (
    <div>
      <MultiSelectList<ProductionStep>
        items={steps}
        selected={selected}
        onChange={onChange}
        getKey={s => s.id}
        renderItem={s => (
          <span className="flex-1">
            <span className="font-medium">{s.stepName}</span>
            <span className="ml-2 text-xs text-gray-500">
              [
              {s.stepCode}
              ]
            </span>
            {s.stepGroup && (
              <span className="ml-2 text-xs text-gray-400">
                (
                {s.stepGroup}
                )
              </span>
            )}
          </span>
        )}
        searchPlaceholder="Tìm kiếm công đoạn..."
        filterFn={filterFn}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
