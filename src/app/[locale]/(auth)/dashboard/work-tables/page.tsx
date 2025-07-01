'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { WorkTableDetail } from '@/features/workTable/WorkTableDetail';
import { WorkTableForm } from '@/features/workTable/WorkTableForm';
import { WorkTableList } from '@/features/workTable/WorkTableList';
import { useCreateWorkTable, useUpdateWorkTable } from '@/hooks/useWorkTableMutations';
import type { WorkTable } from '@/types/workTable';

export default function WorkTablesPage() {
  const { userId } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [selectedWorkTable, setSelectedWorkTable] = useState<WorkTable | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { createWorkTable, isLoading: isCreatingLoading, error: createError } = useCreateWorkTable();
  const { updateWorkTable, isLoading: isUpdatingLoading, error: updateError } = useUpdateWorkTable();

  const handleCreate = () => {
    setSelectedWorkTable(null);
    setIsCreating(true);
  };

  const handleEdit = (workTable: WorkTable) => {
    setSelectedWorkTable(workTable);
    setIsEditing(true);
  };

  const handleView = (workTable: WorkTable) => {
    setSelectedWorkTable(workTable);
    setIsViewing(true);
  };

  const handleClose = () => {
    setIsCreating(false);
    setIsEditing(false);
    setIsViewing(false);
    setSelectedWorkTable(null);
  };

  const handleFormSubmit = async (data: any) => {
    // Các trường số phải >= 1
    const minOneFields = [
      'tableCategory',
      'capacityPerDay',
      'capacityPerHour',
    ];
    minOneFields.forEach((field) => {
      if (typeof data[field] !== 'number' || isNaN(data[field]) || data[field] < 1) {
        data[field] = 1;
      }
    });
    // Các trường số còn lại nếu NaN thì về 0
    const zeroFields = [
      'tableSizeLength',
      'tableSizeWidth',
      'utilizationRate',
      'efficiencyRating',
      'totalProcessedUnits',
    ];
    zeroFields.forEach((field) => {
      if (typeof data[field] !== 'number' || isNaN(data[field])) {
        data[field] = 0;
      }
    });
    try {
      if (isEditing && selectedWorkTable) {
        await updateWorkTable(selectedWorkTable.id, data);
      } else {
        await createWorkTable({ ...data, ownerId: userId });
      }
      handleClose();
      setRefreshKey(k => k + 1);
    } catch {}
  };

  // Helper: convert WorkTable sang Partial<WorkTableFormData>
  function toFormData(table: WorkTable | null): Partial<import('@/types/workTable').WorkTableFormData> | undefined {
    if (!table) {
      return undefined;
    }
    return {
      ...table,
      tableCategory: typeof table.tableCategory === 'number' ? table.tableCategory : 0,
      capacityPerDay: typeof table.capacityPerDay === 'number' ? table.capacityPerDay : 0,
      capacityPerHour: typeof table.capacityPerHour === 'number' ? table.capacityPerHour : 0,
      tableSizeLength:
        typeof table.tableSizeLength === 'number' && !isNaN(table.tableSizeLength)
          ? (table.tableSizeLength as number).toString()
          : typeof table.tableSizeLength === 'string'
            ? table.tableSizeLength
            : undefined,
      tableSizeWidth:
        typeof table.tableSizeWidth === 'number' && !isNaN(table.tableSizeWidth)
          ? (table.tableSizeWidth as number).toString()
          : typeof table.tableSizeWidth === 'string'
            ? table.tableSizeWidth
            : undefined,
      utilizationRate: typeof table.utilizationRate === 'number' ? table.utilizationRate : 0,
      efficiencyRating: typeof table.efficiencyRating === 'number' ? table.efficiencyRating : 0,
      totalProcessedUnits: typeof table.totalProcessedUnits === 'number' ? table.totalProcessedUnits : 0,
      lastMaintenanceDate: table.lastMaintenanceDate ? (typeof table.lastMaintenanceDate === 'string' ? table.lastMaintenanceDate : table.lastMaintenanceDate.toISOString().slice(0, 10)) : null,
      nextMaintenanceDate: table.nextMaintenanceDate ? (typeof table.nextMaintenanceDate === 'string' ? table.nextMaintenanceDate : table.nextMaintenanceDate.toISOString().slice(0, 10)) : null,
      installationDate: table.installationDate ? (typeof table.installationDate === 'string' ? table.installationDate : table.installationDate.toISOString().slice(0, 10)) : null,
      warrantyExpiryDate: table.warrantyExpiryDate ? (typeof table.warrantyExpiryDate === 'string' ? table.warrantyExpiryDate : table.warrantyExpiryDate.toISOString().slice(0, 10)) : null,
      tableName: table.tableName === null ? undefined : table.tableName,
      tableDetail: table.tableDetail === null ? undefined : table.tableDetail,
      tableType:
        table.tableType === null
        || (typeof table.tableType === 'string' && !['cutting', 'sewing', 'embroidery', 'packing', 'quality_control', 'other'].includes(table.tableType))
          ? undefined
          : (table.tableType as import('@/types/workTable').TableType),
      locationCode: table.locationCode === null ? undefined : table.locationCode,
      department: table.department === null ? undefined : table.department,
      assignedOperator: table.assignedOperator === null ? undefined : table.assignedOperator,
      supervisor: table.supervisor === null ? undefined : table.supervisor,
      availabilitySchedule: table.availabilitySchedule === null ? undefined : table.availabilitySchedule,
      equipmentModel: table.equipmentModel === null ? undefined : table.equipmentModel,
      specialCapabilities: table.specialCapabilities === null ? undefined : table.specialCapabilities,
      limitations: table.limitations === null ? undefined : table.limitations,
      note: table.note === null ? undefined : table.note,
      status:
        table.status === null
        || (typeof table.status === 'string' && !['active', 'maintenance', 'offline', 'repair', 'decommissioned'].includes(table.status))
          ? undefined
          : (table.status as import('@/types/workTable').WorkTableStatus),
    };
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Work Tables</h1>
        <p className="text-muted-foreground">
          Manage your production work tables and equipment
        </p>
      </div>

      <div className="mb-4">
        <Button onClick={handleCreate}>
          Add Work Table
        </Button>
      </div>

      <WorkTableList
        onEdit={handleEdit}
        onView={handleView}
        key={refreshKey}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || isEditing} onOpenChange={handleClose}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <h3 className="text-lg font-semibold">{isEditing ? 'Edit Work Table' : 'Add Work Table'}</h3>
          </div>
          <WorkTableForm
            onSubmit={handleFormSubmit}
            onCancel={handleClose}
            initialValues={toFormData(selectedWorkTable)}
            isLoading={isCreatingLoading || isUpdatingLoading}
          />
          {(createError || updateError) && <div className="p-2 text-red-500">{createError || updateError}</div>}
        </div>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewing} onOpenChange={handleClose}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <h3 className="text-lg font-semibold">Work Table Details</h3>
          </div>
          {selectedWorkTable && <WorkTableDetail workTable={selectedWorkTable} />}
        </div>
      </Dialog>
    </div>
  );
}
