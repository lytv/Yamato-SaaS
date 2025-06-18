'use client';

import { useTranslations } from 'next-intl';
import React from 'react';

import type { Product } from '@/types/product';
import type { ProductionStep } from '@/types/productionStep';

export type ExistingAssignment = {
  productId: Product['id'];
  productionStepId: ProductionStep['id'];
};

type MultiAssignPreviewProps = {
  selectedProducts: Product[];
  selectedSteps: ProductionStep[];
  existingAssignments?: ExistingAssignment[];
};

export function MultiAssignPreview({
  selectedProducts,
  selectedSteps,
  existingAssignments,
}: MultiAssignPreviewProps) {
  const t = useTranslations('MultiAssignPreview');
  const assignments = existingAssignments === undefined ? [] : existingAssignments;
  const totalCombinations = selectedProducts.length * selectedSteps.length;

  // Build a Set for fast conflict lookup
  const existingSet = React.useMemo(() => {
    return new Set(assignments.map(a => `${a.productId}|${a.productionStepId}`));
  }, [assignments]);

  // Find conflicts
  const conflicts = React.useMemo(() => {
    const result: { product: Product; step: ProductionStep }[] = [];
    for (const product of selectedProducts) {
      for (const step of selectedSteps) {
        if (existingSet.has(`${product.id}|${step.id}`)) {
          result.push({ product, step });
        }
      }
    }
    return result;
  }, [selectedProducts, selectedSteps, existingSet]);

  const allConflicted = conflicts.length === totalCombinations && totalCombinations > 0;

  return (
    <div className="space-y-2">
      <div className="font-medium">
        {t('totalCombinations')}
        {' '}
        <span className="text-blue-600">{totalCombinations}</span>
      </div>
      {conflicts.length > 0 && (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-2 text-yellow-700">
          <div className="mb-1 font-semibold">
            {t('conflictWarning', { count: conflicts.length })}
          </div>
          <ul className="max-h-32 overflow-y-auto text-xs">
            {conflicts.slice(0, 10).map(({ product, step }) => (
              <li key={`${product.id}-${step.id}`}>
                {t('productLabel')}
                {' '}
                <b>{product.productName}</b>
                {' '}
                -
                {' '}
                {t('stepLabel')}
                {' '}
                <b>{step.stepName}</b>
              </li>
            ))}
            {conflicts.length > 10 && (
              <li>
                {t('otherConflicts', { count: conflicts.length - 10 })}
              </li>
            )}
          </ul>
        </div>
      )}
      {allConflicted && totalCombinations > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-2 font-semibold text-red-700">
          {t('allConflicted')}
        </div>
      )}
    </div>
  );
}
