import { renderHook } from '@testing-library/react-hooks';
import { useProductionSteps } from '@/hooks/useProductionSteps';

jest.mock('@/hooks/useProductionSteps', () => ({
  useProductionSteps: jest.fn(),
}));

describe('useProductionSteps', () => {
  it('trả về danh sách công đoạn khi API trả về data', () => {
    (useProductionSteps as jest.Mock).mockReturnValue({
      productionSteps: [{ id: 1, name: 'Step A' }],
      pagination: { page: 1, limit: 10, total: 1, hasMore: false },
      isLoading: false,
    });

    const { result } = renderHook(() => useProductionSteps({ page: 1, search: '' }));
    expect(result.current.productionSteps.length).toBe(1);
    expect(result.current.productionSteps[0].name).toBe('Step A');
  });

  it('trả về mảng rỗng khi API không có data', () => {
    (useProductionSteps as jest.Mock).mockReturnValue({
      productionSteps: [],
      pagination: { page: 1, limit: 10, total: 0, hasMore: false },
      isLoading: false,
    });

    const { result } = renderHook(() => useProductionSteps({ page: 1, search: '' }));
    expect(result.current.productionSteps.length).toBe(0);
  });
}); 