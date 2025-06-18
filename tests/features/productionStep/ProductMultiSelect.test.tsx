import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductMultiSelect } from '@/features/productionStep/ProductMultiSelect';
import type { Product } from '@/types/product';

const products: Product[] = [
  { id: 1, productName: 'A', productCode: 'A1', createdAt: '', updatedAt: '', category: 'Cat1', ownerId: 'u', notes: null },
  { id: 2, productName: 'B', productCode: 'B2', createdAt: '', updatedAt: '', category: 'Cat2', ownerId: 'u', notes: null },
];

describe('ProductMultiSelect', () => {
  it('renders products', () => {
    render(
      <ProductMultiSelect products={products} selected={[]} onChange={() => {}} />
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('filters by search', () => {
    render(
      <ProductMultiSelect products={products} selected={[]} onChange={() => {}} />
    );
    fireEvent.change(screen.getByPlaceholderText(/tìm kiếm/i), { target: { value: 'B2' } });
    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('selects and deselects product', () => {
    const handleChange = vi.fn();
    render(
      <ProductMultiSelect products={products} selected={[]} onChange={handleChange} />
    );
    fireEvent.click(screen.getByText('A'));
    expect(handleChange).toHaveBeenCalledWith([products[0]]);
  });
}); 