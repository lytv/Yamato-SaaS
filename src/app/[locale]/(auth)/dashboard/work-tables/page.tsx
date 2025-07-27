'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Table, Plus, Wrench, BarChart3, Settings, Users } from 'lucide-react';

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
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-8 lg:mb-0">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Table className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Quản lý bàn làm việc
                  </h1>
                  <p className="text-purple-100 text-lg">
                    Quản lý và theo dõi các bàn làm việc trong xưởng sản xuất
                  </p>
                </div>
              </div>
              
              {/* Feature indicators */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Wrench className="w-4 h-4" />
                  <span>Work Station Management</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Users className="w-4 h-4" />
                  <span>Operator Assignment</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Efficiency Tracking</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="lg:text-right">
              <Button
                onClick={handleCreate}
                className="bg-white text-purple-600 hover:bg-purple-50 border-0 shadow-lg text-lg px-8 py-4 h-auto font-semibold transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t('add_new', { default: 'Add Work Table' })}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="container mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Create/Edit Form */}
        {formMode !== 'hidden' && (
          <div className="relative">
            {/* Modal Backdrop */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="relative z-10 w-full max-w-5xl mx-4 rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
                      <Table className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {formMode === 'edit' ? 'Edit Work Table' : 'Create Work Table'}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {formMode === 'edit' 
                          ? 'Update work table configuration'
                          : 'Add a new work table to the production line'
                        }
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFormCancel}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2"
                  >
                    <span className="text-lg">×</span>
                  </Button>
                </div>

                <div className="p-6">
                  <WorkTableForm
                    title={formMode === 'edit' ? 'edit_title' : 'create_title'}
                    isEditMode={formMode === 'edit'}
                    onSubmit={handleFormSubmit}
                    onCancel={handleFormCancel}
                    initialValues={toFormData(selectedWorkTable)}
                    isLoading={isCreatingLoading || isUpdatingLoading}
                  />
                  {(createError || updateError) && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-red-600" />
                        <p className="text-sm font-medium text-red-800">Error</p>
                      </div>
                      <p className="mt-1 text-sm text-red-700">{createError || updateError}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <WorkTableList
          onEdit={handleEdit}
          key={refreshKey}
        />
      </div>
    </main>
  );
}
