/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';

import { useProductionStepDetailQuantityLimit } from '../useProductionStepDetailQuantityLimit';

// Mock fetch
global.fetch = jest.fn();

describe('useProductionStepDetailQuantityLimit', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should return null initially', () => {
    const { result } = renderHook(() => useProductionStepDetailQuantityLimit());

    expect(result.current.quantityLimit).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch quantity limit successfully', async () => {
    const mockData = {
      success: true,
      data: {
        id: 1,
        quantityLimit1: 100,
        quantityLimit2: 50,
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useProductionStepDetailQuantityLimit());

    const limitData = await result.current.fetchQuantityLimit(1);

    await waitFor(() => {
      expect(result.current.quantityLimit).toEqual({
        quantityLimit1: 100,
        quantityLimit2: 50,
        effectiveLimit: 100,
      });
    });

    expect(limitData).toEqual({
      quantityLimit1: 100,
      quantityLimit2: 50,
      effectiveLimit: 100,
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/production-step-details/quantity-limit?productionStepDetailId=1'
    );
  });

  it('should handle fetch error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useProductionStepDetailQuantityLimit());

    const limitData = await result.current.fetchQuantityLimit(1);

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
      expect(result.current.quantityLimit).toBeNull();
    });

    expect(limitData).toBeNull();
  });

  it('should return null when productionStepDetailId is not provided', async () => {
    const { result } = renderHook(() => useProductionStepDetailQuantityLimit());

    const limitData = await result.current.fetchQuantityLimit(0);

    expect(limitData).toBeNull();
    expect(result.current.quantityLimit).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should reset quantity limit', () => {
    const { result } = renderHook(() => useProductionStepDetailQuantityLimit());

    result.current.resetQuantityLimit();

    expect(result.current.quantityLimit).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});