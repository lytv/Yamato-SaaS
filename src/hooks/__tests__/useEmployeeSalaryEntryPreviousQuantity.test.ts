/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';

import { useEmployeeSalaryEntryPreviousQuantity } from '../useEmployeeSalaryEntryPreviousQuantity';

// Mock fetch
global.fetch = jest.fn();

describe('useEmployeeSalaryEntryPreviousQuantity', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should return null initially', () => {
    const { result } = renderHook(() => useEmployeeSalaryEntryPreviousQuantity());

    expect(result.current.previousQuantity).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch previous quantity successfully', async () => {
    const mockData = {
      success: true,
      data: {
        planId: 1,
        productId: 2,
        productionStepDetailId: 3,
        totalPreviousQuantity: 250,
        excludedId: null,
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useEmployeeSalaryEntryPreviousQuantity());

    const previousData = await result.current.fetchPreviousQuantity(1, 2, 3);

    await waitFor(() => {
      expect(result.current.previousQuantity).toEqual({
        planId: 1,
        productId: 2,
        productionStepDetailId: 3,
        totalPreviousQuantity: 250,
        excludedId: null,
      });
    });

    expect(previousData).toEqual(mockData.data);

    expect(fetch).toHaveBeenCalledWith(
      '/api/employee-salary-entries/previous-quantity?planId=1&productId=2&productionStepDetailId=3'
    );
  });

  it('should fetch previous quantity with excludeId', async () => {
    const mockData = {
      success: true,
      data: {
        planId: 1,
        productId: 2,
        productionStepDetailId: 3,
        totalPreviousQuantity: 200,
        excludedId: 5,
      },
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useEmployeeSalaryEntryPreviousQuantity());

    const previousData = await result.current.fetchPreviousQuantity(1, 2, 3, 5);

    expect(fetch).toHaveBeenCalledWith(
      '/api/employee-salary-entries/previous-quantity?planId=1&productId=2&productionStepDetailId=3&excludeId=5'
    );

    expect(previousData?.excludedId).toBe(5);
  });

  it('should handle fetch error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useEmployeeSalaryEntryPreviousQuantity());

    const previousData = await result.current.fetchPreviousQuantity(1, 2, 3);

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
      expect(result.current.previousQuantity).toBeNull();
    });

    expect(previousData).toBeNull();
  });

  it('should return null when required parameters are missing', async () => {
    const { result } = renderHook(() => useEmployeeSalaryEntryPreviousQuantity());

    const previousData1 = await result.current.fetchPreviousQuantity(0, 2, 3);
    const previousData2 = await result.current.fetchPreviousQuantity(1, 0, 3);
    const previousData3 = await result.current.fetchPreviousQuantity(1, 2, 0);

    expect(previousData1).toBeNull();
    expect(previousData2).toBeNull();
    expect(previousData3).toBeNull();
    expect(result.current.previousQuantity).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should reset previous quantity', () => {
    const { result } = renderHook(() => useEmployeeSalaryEntryPreviousQuantity());

    result.current.resetPreviousQuantity();

    expect(result.current.previousQuantity).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});