import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import { WorkTableList } from '@/features/workTable/WorkTableList';
import type { WorkTable } from '@/types/workTable';

// Mock hook
vi.mock('@/hooks/useWorkTables', () => ({
  useWorkTables: () => ({
    workTables: [],
    pagination: null,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));
vi.mock('@/hooks/useWorkTableMutations', () => ({
  useDeleteWorkTable: () => ({
    deleteWorkTable: vi.fn(),
    isLoading: false,
  }),
}));

describe('WorkTableList', () => {
  it('renders empty state', () => {
    render(<WorkTableList />);
    expect(screen.getByText(/No work tables found/i)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    vi.doMock('@/hooks/useWorkTables', () => ({
      useWorkTables: () => ({
        workTables: [],
        pagination: null,
        isLoading: true,
        error: null,
        refresh: vi.fn(),
      }),
    }));
    const { unmount } = render(<WorkTableList />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    unmount();
    vi.resetModules();
  });

  it('renders error state', () => {
    vi.doMock('@/hooks/useWorkTables', () => ({
      useWorkTables: () => ({
        workTables: [],
        pagination: null,
        isLoading: false,
        error: 'Test error',
        refresh: vi.fn(),
      }),
    }));
    const { unmount } = render(<WorkTableList />);
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
    unmount();
    vi.resetModules();
  });

  it('calls onEdit and onView', () => {
    const workTables: WorkTable[] = [
      {
        id: 1,
        ownerId: 'owner',
        tableCode: 'T1',
        tableName: 'Table 1',
        tableDetail: '',
        tableType: 'cutting',
        tableCategory: 1,
        capacityPerDay: 10,
        capacityPerHour: 2,
        tableSizeLength: 1,
        tableSizeWidth: 1,
        locationCode: '',
        department: '',
        assignedOperator: '',
        supervisor: '',
        status: 'active',
        availabilitySchedule: '',
        lastMaintenanceDate: null,
        nextMaintenanceDate: null,
        equipmentModel: '',
        installationDate: null,
        warrantyExpiryDate: null,
        utilizationRate: 0,
        efficiencyRating: 0,
        totalProcessedUnits: 0,
        specialCapabilities: '',
        limitations: '',
        note: '',
        createdAt: '',
        updatedAt: '',
      },
    ];
    vi.doMock('@/hooks/useWorkTables', () => ({
      useWorkTables: () => ({
        workTables,
        pagination: null,
        isLoading: false,
        error: null,
        refresh: vi.fn(),
      }),
    }));
    const onEdit = vi.fn();
    const onView = vi.fn();
    const { unmount } = render(<WorkTableList onEdit={onEdit} onView={onView} />);
    fireEvent.click(screen.getByText(/Edit/i));
    expect(onEdit).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/View/i));
    expect(onView).toHaveBeenCalled();
    unmount();
    vi.resetModules();
  });
}); 