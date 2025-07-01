import { render, act } from '@testing-library/react';
import { vi } from 'vitest';
import * as api from '@/libs/api/workTables';
import { useWorkTables } from '@/hooks/useWorkTables';
import type { WorkTable } from '@/types/workTable';
import React from 'react';

type HookState = ReturnType<typeof useWorkTables>;

function HookTest({ params, onState }: { params: any; onState: (state: HookState) => void }) {
  const state = useWorkTables(params);
  React.useEffect(() => {
    onState(state);
  }, [state]);
  return null;
}

describe('useWorkTables', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('fetches work tables successfully', async () => {
    const mockData: WorkTable[] = [{
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
    }];
    vi.spyOn(api, 'fetchWorkTables').mockResolvedValue({
      data: mockData,
      pagination: { page: 1, limit: 10, total: 1, hasMore: false },
      success: true,
    });
    let state: HookState | undefined;
    await act(async () => {
      render(<HookTest params={{ page: 1, limit: 10 }} onState={s => { state = s; }} />);
    });
    // Wait for state to update
    await act(async () => {
      await Promise.resolve();
    });
    expect(state?.workTables.length).toBe(1);
    expect(state?.isLoading).toBe(false);
    expect(state?.error).toBeNull();
  });

  it('handles loading state', () => {
    vi.spyOn(api, 'fetchWorkTables').mockReturnValue(new Promise(() => {}));
    let state: HookState | undefined;
    act(() => {
      render(<HookTest params={{ page: 1, limit: 10 }} onState={s => { state = s; }} />);
    });
    expect(state?.isLoading).toBe(true);
  });

  it('handles error state', async () => {
    vi.spyOn(api, 'fetchWorkTables').mockRejectedValue(new Error('Test error'));
    let state: HookState | undefined;
    await act(async () => {
      render(<HookTest params={{ page: 1, limit: 10 }} onState={s => { state = s; }} />);
    });
    // Wait for state to update
    await act(async () => {
      await Promise.resolve();
    });
    expect(state?.error).toBe('Test error');
    expect(state?.isLoading).toBe(false);
  });

  it('passes filter params', async () => {
    const spy = vi.spyOn(api, 'fetchWorkTables').mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, hasMore: false },
      success: true,
    });
    await act(async () => {
      render(<HookTest params={{ page: 2, limit: 5, search: 'abc' }} onState={() => {}} />);
    });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 5, search: 'abc' }));
  });
}); 