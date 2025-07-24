/**
 * useEmployeeDeliveryReceiptInventory Hook Tests
 * Following TDD Workflow Standards and Yamato-SaaS testing patterns
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useEmployeeDeliveryReceiptInventory } from '../useEmployeeDeliveryReceiptInventory';

// Mock the API function
vi.mock('@/libs/api/employeeDeliveryReceiptInventory', () => ({
  fetchEmployeeDeliveryReceiptInventory: vi.fn(),
}));

describe('useEmployeeDeliveryReceiptInventory', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useEmployeeDeliveryReceiptInventory());

    expect(result.current.data).toEqual([]);
    expect(result.current.summary).toBeNull();
    expect(result.current.pagination).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refresh).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle successful data fetch', async () => {
    const mockResponse = {
      success: true,
      data: [
        {
          employee_id: 'emp001',
          employee_name: 'John Doe',
          plan_code: 'T.6',
          product_code: 'NHA01',
          product_name: 'Product A',
          step_code: 'MAY',
          step_name: 'Sewing',
          total_assigned: 100,
          total_received: 80,
          total_defect: 5,
          total_rework: 3,
          current_inventory: 20,
          completion_rate: 80.5,
        },
      ],
      summary: {
        total_records: 1,
        total_employees: 1,
        total_assigned: 100,
        total_received: 80,
        total_defect: 5,
        total_rework: 3,
        total_inventory: 20,
        average_completion_rate: 80.5,
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        hasMore: false,
      },
    };

    const { fetchEmployeeDeliveryReceiptInventory } = require('@/libs/api/employeeDeliveryReceiptInventory');
    fetchEmployeeDeliveryReceiptInventory.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useEmployeeDeliveryReceiptInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockResponse.data);
    expect(result.current.summary).toEqual(mockResponse.summary);
    expect(result.current.pagination).toEqual(mockResponse.pagination);
    expect(result.current.error).toBeNull();
  });

  it('should handle API error', async () => {
    const mockError = {
      success: false,
      error: 'API Error',
      code: 'API_ERROR',
    };

    const { fetchEmployeeDeliveryReceiptInventory } = require('@/libs/api/employeeDeliveryReceiptInventory');
    fetchEmployeeDeliveryReceiptInventory.mockResolvedValue(mockError);

    const { result } = renderHook(() => useEmployeeDeliveryReceiptInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.summary).toBeNull();
    expect(result.current.pagination).toBeNull();
    expect(result.current.error).toBe('API Error');
  });

  it('should handle network error', async () => {
    const { fetchEmployeeDeliveryReceiptInventory } = require('@/libs/api/employeeDeliveryReceiptInventory');
    fetchEmployeeDeliveryReceiptInventory.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useEmployeeDeliveryReceiptInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.summary).toBeNull();
    expect(result.current.pagination).toBeNull();
    expect(result.current.error).toBe('Network Error');
  });

  it('should refetch data when refresh is called', async () => {
    const { fetchEmployeeDeliveryReceiptInventory } = require('@/libs/api/employeeDeliveryReceiptInventory');
    fetchEmployeeDeliveryReceiptInventory.mockResolvedValue({
      success: true,
      data: [],
      summary: null,
      pagination: null,
    });

    const { result } = renderHook(() => useEmployeeDeliveryReceiptInventory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Call refresh
    result.current.refresh();

    expect(fetchEmployeeDeliveryReceiptInventory).toHaveBeenCalledTimes(2);
  });
});