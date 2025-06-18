import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepMultiSelect } from '@/features/productionStep/StepMultiSelect';
import type { ProductionStep } from '@/types/productionStep';

const steps: ProductionStep[] = [
  { id: 1, stepName: 'Cắt', stepCode: 'CT', createdAt: '', updatedAt: '', ownerId: 'u', filmSequence: null, stepGroup: 'Nhóm1', notes: null },
  { id: 2, stepName: 'May', stepCode: 'MY', createdAt: '', updatedAt: '', ownerId: 'u', filmSequence: null, stepGroup: 'Nhóm2', notes: null },
];

describe('StepMultiSelect', () => {
  it('renders steps', () => {
    render(
      <StepMultiSelect steps={steps} selected={[]} onChange={() => {}} />
    );
    expect(screen.getByText('Cắt')).toBeInTheDocument();
    expect(screen.getByText('May')).toBeInTheDocument();
  });

  it('filters by search', () => {
    render(
      <StepMultiSelect steps={steps} selected={[]} onChange={() => {}} />
    );
    fireEvent.change(screen.getByPlaceholderText(/tìm kiếm/i), { target: { value: 'MY' } });
    expect(screen.queryByText('Cắt')).not.toBeInTheDocument();
    expect(screen.getByText('May')).toBeInTheDocument();
  });

  it('selects and deselects step', () => {
    const handleChange = vi.fn();
    render(
      <StepMultiSelect steps={steps} selected={[]} onChange={handleChange} />
    );
    fireEvent.click(screen.getByText('Cắt'));
    expect(handleChange).toHaveBeenCalledWith([steps[0]]);
  });
}); 