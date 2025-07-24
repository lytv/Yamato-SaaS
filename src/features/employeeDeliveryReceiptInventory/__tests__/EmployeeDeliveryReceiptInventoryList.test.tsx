/**
 * EmployeeDeliveryReceiptInventoryList Component Tests
 * Following TDD Workflow Standards and Yamato-SaaS testing patterns
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EmployeeDeliveryReceiptInventoryList } from '../EmployeeDeliveryReceiptInventoryList';

// Mock the hooks
vi.mock('@/hooks/useEmployeeDeliveryReceiptInventory', () => ({
  useEmployeeDeliveryReceiptInventory: vi.fn(() => ({
    data: [],
    summary: null,
    pagination: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/hooks/useEmployeeDeliveryReceiptInventoryFilters', () => ({
  useEmployeeDeliveryReceiptInventoryFilters: vi.fn(() => ({
    filters: {
      search: '',
      plan_code: '',
      product_code: '',
      production_step_code: '',
      employee_id: '',
      sortBy: 'employee_name',
      sortOrder: 'asc',
    },
    getApiFilters: vi.fn(() => ({})),
  })),
}));

vi.mock('@/hooks/useEmployeeDeliveryReceiptInventoryExport', () => ({
  useEmployeeDeliveryReceiptInventoryExport: vi.fn(() => ({
    exportData: vi.fn(),
    isExporting: false,
    exportError: null,
  })),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

describe('EmployeeDeliveryReceiptInventoryList', () => {
  it('should render loading skeleton when loading', () => {
    const { useEmployeeDeliveryReceiptInventory } = require('@/hooks/useEmployeeDeliveryReceiptInventory');
    useEmployeeDeliveryReceiptInventory.mockReturnValue({
      data: [],
      summary: null,
      pagination: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<EmployeeDeliveryReceiptInventoryList />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    render(<EmployeeDeliveryReceiptInventoryList />);
    
    expect(screen.getByText('no_data')).toBeInTheDocument();
  });

  it('should render error state when error occurs', () => {
    const { useEmployeeDeliveryReceiptInventory } = require('@/hooks/useEmployeeDeliveryReceiptInventory');
    useEmployeeDeliveryReceiptInventory.mockReturnValue({
      data: [],
      summary: null,
      pagination: null,
      isLoading: false,
      error: 'Test error',
      refetch: vi.fn(),
    });

    render(<EmployeeDeliveryReceiptInventoryList />);
    
    expect(screen.getByText('error_title')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should render data table when data is available', () => {
    const mockData = [
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
    ];

    const mockSummary = {
      total_records: 1,
      total_employees: 1,
      total_assigned: 100,
      total_received: 80,
      total_defect: 5,
      total_rework: 3,
      total_inventory: 20,
      average_completion_rate: 80.5,
    };

    const { useEmployeeDeliveryReceiptInventory } = require('@/hooks/useEmployeeDeliveryReceiptInventory');
    useEmployeeDeliveryReceiptInventory.mockReturnValue({
      data: mockData,
      summary: mockSummary,
      pagination: { page: 1, limit: 20, total: 1, hasMore: false },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<EmployeeDeliveryReceiptInventoryList />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('T.6')).toBeInTheDocument();
    expect(screen.getByText('NHA01')).toBeInTheDocument();
    expect(screen.getByText('Product A')).toBeInTheDocument();
  });

  it('should render summary cards when summary data is available', () => {
    const mockSummary = {
      total_records: 10,
      total_employees: 5,
      total_assigned: 1000,
      total_received: 800,
      total_defect: 50,
      total_rework: 30,
      total_inventory: 200,
      average_completion_rate: 80.0,
    };

    const { useEmployeeDeliveryReceiptInventory } = require('@/hooks/useEmployeeDeliveryReceiptInventory');
    useEmployeeDeliveryReceiptInventory.mockReturnValue({
      data: [],
      summary: mockSummary,
      pagination: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<EmployeeDeliveryReceiptInventoryList />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // total_employees
    expect(screen.getByText('1,000')).toBeInTheDocument(); // total_assigned
    expect(screen.getByText('800')).toBeInTheDocument(); // total_received
    expect(screen.getByText('80.00%')).toBeInTheDocument(); // average_completion_rate
  });
});