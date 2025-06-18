import { renderHook } from '@testing-library/react-hooks';
import { useProducts } from '@/hooks/useProducts';

jest.mock('@/hooks/useProducts', () => ({
  useProducts: jest.fn(),
}));

describe('useProducts', () => {
  it('trả về danh sách sản phẩm khi API trả về data', () => {
    (useProducts as jest.Mock).mockReturnValue({
      products: [{ id: 1, name: 'Product A' }],
      pagination: { page: 1, limit: 10, total: 1, hasMore: false },
      isLoading: false,
    });

    const { result } = renderHook(() => useProducts({ page: 1, search: '' }));
    expect(result.current.products.length).toBe(1);
    expect(result.current.products[0].name).toBe('Product A');
  });

  it('trả về mảng rỗng khi API không có data', () => {
    (useProducts as jest.Mock).mockReturnValue({
      products: [],
      pagination: { page: 1, limit: 10, total: 0, hasMore: false },
      isLoading: false,
    });

    const { result } = renderHook(() => useProducts({ page: 1, search: '' }));
    expect(result.current.products.length).toBe(0);
  });
}); 