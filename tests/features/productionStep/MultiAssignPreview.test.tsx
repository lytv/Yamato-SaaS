import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiAssignPreview, ExistingAssignment } from '@/features/productionStep/MultiAssignPreview';
import type { Product } from '@/types/product';
import type { ProductionStep } from '@/types/productionStep';

const products: Product[] = [
  { id: 1, productName: 'A', productCode: 'A1', createdAt: '', updatedAt: '', category: 'Cat1', ownerId: 'u', notes: null },
  { id: 2, productName: 'B', productCode: 'B2', createdAt: '', updatedAt: '', category: 'Cat2', ownerId: 'u', notes: null },
];
const steps: ProductionStep[] = [
  { id: 10, stepName: 'Cắt', stepCode: 'CT', createdAt: '', updatedAt: '', ownerId: 'u', filmSequence: null, stepGroup: 'Nhóm1', notes: null },
  { id: 20, stepName: 'May', stepCode: 'MY', createdAt: '', updatedAt: '', ownerId: 'u', filmSequence: null, stepGroup: 'Nhóm2', notes: null },
];

describe('MultiAssignPreview', () => {
  it('shows total combinations', () => {
    render(
      <MultiAssignPreview selectedProducts={products} selectedSteps={steps} />
    );
    expect(screen.getByText(/tổng số kết hợp/i)).toHaveTextContent('4');
  });

  it('shows conflict warning', () => {
    const existing: ExistingAssignment[] = [
      { productId: 1, productionStepId: 10 },
      { productId: 2, productionStepId: 20 },
    ];
    render(
      <MultiAssignPreview selectedProducts={products} selectedSteps={steps} existingAssignments={existing} />
    );
    expect(screen.getByText(/cảnh báo/i)).toBeInTheDocument();
    expect(screen.getByText(/đã tồn tại 2 kết hợp/i)).toBeInTheDocument();
  });

  it('shows all-conflicted warning', () => {
    const existing: ExistingAssignment[] = [
      { productId: 1, productionStepId: 10 },
      { productId: 1, productionStepId: 20 },
      { productId: 2, productionStepId: 10 },
      { productId: 2, productionStepId: 20 },
    ];
    render(
      <MultiAssignPreview selectedProducts={products} selectedSteps={steps} existingAssignments={existing} />
    );
    expect(screen.getByText(/tất cả các kết hợp đã tồn tại/i)).toBeInTheDocument();
  });
}); 