'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { WorkTableForm } from '@/features/workTable/WorkTableForm';
import { WorkTableList } from '@/features/workTable/WorkTableList';
import { useCreateWorkTable, useUpdateWorkTable } from '@/hooks/useWorkTableMutations';
import type { WorkTable } from '@/types/workTable';

export default function WorkTablesPage() {
  const { userId } = useAuth();
  const t = useTranslations('workTable.page');
  const [formMode, setFormMode] = useState<'hidden' | 'create' | 'edit'>('hidden');
  const [selectedWorkTable, setSelectedWorkTable] = useState<WorkTable | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { createWorkTable, isLoading: isCreatingLoading, error: createError } = useCreateWorkTable();
  const { updateWorkTable, isLoading: isUpdatingLoading, error: updateError } = useUpdateWorkTable();

  const handleCreate = () => {
    setSelectedWorkTable(null);
    setFormMode('create');
  };

  const handleEdit = (workTable: WorkTable) => {
    setSelectedWorkTable(workTable);
    setFormMode('edit');
  };

  const handleFormCancel = () => {
    setFormMode('hidden');
    setSelectedWorkTable(null);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (formMode === 'edit' && selectedWorkTable) {
        await updateWorkTable(selectedWorkTable.id, data);
      } else {
        const { tableCode, tableName, tableDetail, tableType } = data;
        await createWorkTable({ tableCode, tableName, tableDetail, tableType, ownerId: String(userId) });
      }
      setFormMode('hidden');
      setSelectedWorkTable(null);
      setRefreshKey(k => k + 1);
    } catch {}
  };

  // Helper: convert WorkTable sang Partial<WorkTableFormData>
  function toFormData(table: WorkTable | null): Partial<import('@/types/workTable').WorkTableFormData> | undefined {
    if (!table) {
      return undefined;
    }
    return {
      tableCode: table.tableCode ?? '',
      tableName: table.tableName ?? '',
      tableDetail: table.tableDetail ?? '',
      tableType: (typeof table.tableType === 'string' && ['cutting', 'sewing', 'embroidery', 'packing', 'quality_control', 'other'].includes(table.tableType))
        ? table.tableType as import('@/types/workTable').TableType
        : undefined,
    };
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="mb-4">
        <Button onClick={handleCreate}>
          {t('add_new')}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {formMode !== 'hidden' && (
        <div className="mb-6">
          <WorkTableForm
            title={formMode === 'edit' ? 'edit_title' : 'create_title'}
            isEditMode={formMode === 'edit'}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            initialValues={toFormData(selectedWorkTable)}
            isLoading={isCreatingLoading || isUpdatingLoading}
          />
          {(createError || updateError) && (
            <div className="mt-2 rounded bg-red-50 p-2 text-red-500">
              {createError || updateError}
            </div>
          )}
        </div>
      )}

      <WorkTableList
        onEdit={handleEdit}
        key={refreshKey}
      />
    </div>
  );
}
