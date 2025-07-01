import { render, act } from '@testing-library/react';
import { vi } from 'vitest';
import * as api from '@/libs/api/workTables';
import { useCreateWorkTable, useUpdateWorkTable, useDeleteWorkTable } from '@/hooks/useWorkTableMutations';
import type { CreateWorkTableInput, UpdateWorkTableInput } from '@/types/workTable';
import React from 'react';

type CreateState = ReturnType<typeof useCreateWorkTable>;
type UpdateState = ReturnType<typeof useUpdateWorkTable>;
type DeleteState = ReturnType<typeof useDeleteWorkTable>;

function CreateTest({ onState }: { onState: (state: CreateState) => void }) {
  const state = useCreateWorkTable();
  React.useEffect(() => { onState(state); }, [state]);
  return null;
}
function UpdateTest({ onState }: { onState: (state: UpdateState) => void }) {
  const state = useUpdateWorkTable();
  React.useEffect(() => { onState(state); }, [state]);
  return null;
}
function DeleteTest({ onState }: { onState: (state: DeleteState) => void }) {
  const state = useDeleteWorkTable();
  React.useEffect(() => { onState(state); }, [state]);
  return null;
}

describe('useWorkTableMutations', () => {
  afterEach(() => { vi.resetAllMocks(); });

  it('createWorkTable: success', async () => {
    vi.spyOn(api, 'createWorkTable').mockResolvedValue({ success: true, data: {} });
    let state: CreateState | undefined;
    await act(async () => {
      render(<CreateTest onState={s => { state = s; }} />);
    });
    await act(async () => {
      await state!.createWorkTable({} as CreateWorkTableInput);
    });
    expect(state?.isLoading).toBe(false);
    expect(state?.error).toBeNull();
  });

  it('createWorkTable: error', async () => {
    vi.spyOn(api, 'createWorkTable').mockRejectedValue(new Error('fail'));
    let state: CreateState | undefined;
    await act(async () => {
      render(<CreateTest onState={s => { state = s; }} />);
    });
    await act(async () => {
      try { await state!.createWorkTable({} as CreateWorkTableInput); } catch {}
    });
    expect(state?.isLoading).toBe(false);
    expect(state?.error).toBe('fail');
  });

  it('updateWorkTable: success', async () => {
    vi.spyOn(api, 'updateWorkTable').mockResolvedValue({ success: true, data: {} });
    let state: UpdateState | undefined;
    await act(async () => {
      render(<UpdateTest onState={s => { state = s; }} />);
    });
    await act(async () => {
      await state!.updateWorkTable(1, {} as UpdateWorkTableInput);
    });
    expect(state?.isLoading).toBe(false);
    expect(state?.error).toBeNull();
  });

  it('deleteWorkTable: success', async () => {
    vi.spyOn(api, 'deleteWorkTable').mockResolvedValue(true);
    let state: DeleteState | undefined;
    await act(async () => {
      render(<DeleteTest onState={s => { state = s; }} />);
    });
    await act(async () => {
      await state!.deleteWorkTable(1);
    });
    expect(state?.isLoading).toBe(false);
    expect(state?.error).toBeNull();
  });
}); 