import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WorkTableFormSchema } from '@/libs/validations/workTable';
import type { WorkTableFormData } from '@/types/workTable';
import { Button } from '@/components/ui/button';

const TABLE_TYPES = [
  'cutting',
  'sewing',
  'embroidery',
  'packing',
  'quality_control',
  'other',
];
const STATUS = [
  'active',
  'maintenance',
  'offline',
  'repair',
  'decommissioned',
];

interface WorkTableFormProps {
  initialValues?: Partial<WorkTableFormData>;
  onSubmit: (data: WorkTableFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WorkTableForm({ initialValues, onSubmit, onCancel, isLoading }: WorkTableFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkTableFormData>({
    resolver: zodResolver(WorkTableFormSchema),
    defaultValues: initialValues,
  });

  // Responsive: 2 cột trên md+, 1 cột mobile
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-5xl bg-white rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Create Work Table</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <div>
          <label className="block font-medium">Table Code<span className="text-red-500">*</span></label>
          <input {...register('tableCode')} className="input w-full" placeholder="e.g., TBL-001" />
          {errors.tableCode && <span className="text-red-500 text-xs">{errors.tableCode.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Table Name<span className="text-red-500">*</span></label>
          <input {...register('tableName')} className="input w-full" placeholder="Enter table name" />
          {errors.tableName && <span className="text-red-500 text-xs">{errors.tableName.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Table Detail</label>
          <input {...register('tableDetail')} className="input w-full" placeholder="e.g., Bàn 1, Bàn 2" />
          {errors.tableDetail && <span className="text-red-500 text-xs">{errors.tableDetail.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Table Type</label>
          <select {...register('tableType')} className="input w-full">
            <option value="">Select type</option>
            {TABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.tableType && <span className="text-red-500 text-xs">{errors.tableType.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Table Category</label>
          <input type="number" {...register('tableCategory', { valueAsNumber: true })} className="input w-full" placeholder="e.g., 1" />
          {errors.tableCategory && <span className="text-red-500 text-xs">{errors.tableCategory.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Capacity Per Day</label>
          <input type="number" {...register('capacityPerDay', { valueAsNumber: true })} className="input w-full" placeholder="e.g., 100" />
          {errors.capacityPerDay && <span className="text-red-500 text-xs">{errors.capacityPerDay.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Capacity Per Hour</label>
          <input type="number" {...register('capacityPerHour', { valueAsNumber: true })} className="input w-full" placeholder="e.g., 10" />
          {errors.capacityPerHour && <span className="text-red-500 text-xs">{errors.capacityPerHour.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Table Size Length</label>
          <input type="number" step="0.01" {...register('tableSizeLength', { valueAsNumber: true })} className="input w-full" placeholder="e.g., 2.5" />
          {errors.tableSizeLength && <span className="text-red-500 text-xs">{errors.tableSizeLength.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Table Size Width</label>
          <input type="number" step="0.01" {...register('tableSizeWidth', { valueAsNumber: true })} className="input w-full" placeholder="e.g., 1.2" />
          {errors.tableSizeWidth && <span className="text-red-500 text-xs">{errors.tableSizeWidth.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Location Code</label>
          <input {...register('locationCode')} className="input w-full" placeholder="e.g., K04" />
          {errors.locationCode && <span className="text-red-500 text-xs">{errors.locationCode.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Department</label>
          <input {...register('department')} className="input w-full" placeholder="e.g., Sewing" />
          {errors.department && <span className="text-red-500 text-xs">{errors.department.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Assigned Operator</label>
          <input {...register('assignedOperator')} className="input w-full" placeholder="e.g., John Doe" />
          {errors.assignedOperator && <span className="text-red-500 text-xs">{errors.assignedOperator.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Supervisor</label>
          <input {...register('supervisor')} className="input w-full" placeholder="e.g., Jane Smith" />
          {errors.supervisor && <span className="text-red-500 text-xs">{errors.supervisor.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Status</label>
          <select {...register('status')} className="input w-full">
            <option value="">Select status</option>
            {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.status && <span className="text-red-500 text-xs">{errors.status.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Availability Schedule</label>
          <input {...register('availabilitySchedule')} className="input w-full" placeholder="e.g., Mon-Fri 8:00-17:00" />
          {errors.availabilitySchedule && <span className="text-red-500 text-xs">{errors.availabilitySchedule.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Last Maintenance Date</label>
          <input type="date" {...register('lastMaintenanceDate')} className="input w-full" />
          {errors.lastMaintenanceDate && <span className="text-red-500 text-xs">{errors.lastMaintenanceDate.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Next Maintenance Date</label>
          <input type="date" {...register('nextMaintenanceDate')} className="input w-full" />
          {errors.nextMaintenanceDate && <span className="text-red-500 text-xs">{errors.nextMaintenanceDate.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Equipment Model</label>
          <input {...register('equipmentModel')} className="input w-full" placeholder="e.g., Model X" />
          {errors.equipmentModel && <span className="text-red-500 text-xs">{errors.equipmentModel.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Installation Date</label>
          <input type="date" {...register('installationDate')} className="input w-full" />
          {errors.installationDate && <span className="text-red-500 text-xs">{errors.installationDate.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Warranty Expiry Date</label>
          <input type="date" {...register('warrantyExpiryDate')} className="input w-full" />
          {errors.warrantyExpiryDate && <span className="text-red-500 text-xs">{errors.warrantyExpiryDate.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Utilization Rate (%)</label>
          <input type="number" step="0.01" {...register('utilizationRate', { valueAsNumber: true })} className="input w-full" placeholder="e.g., 85.5" />
          {errors.utilizationRate && <span className="text-red-500 text-xs">{errors.utilizationRate.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Efficiency Rating (%)</label>
          <input type="number" step="0.01" {...register('efficiencyRating', { valueAsNumber: true })} className="input w-full" placeholder="e.g., 90.0" />
          {errors.efficiencyRating && <span className="text-red-500 text-xs">{errors.efficiencyRating.message}</span>}
        </div>
        <div>
          <label className="block font-medium">Total Processed Units</label>
          <input type="number" {...register('totalProcessedUnits', { valueAsNumber: true })} className="input w-full" placeholder="e.g., 1000" />
          {errors.totalProcessedUnits && <span className="text-red-500 text-xs">{errors.totalProcessedUnits.message}</span>}
        </div>
        <div className="md:col-span-3 xl:col-span-4">
          <label className="block font-medium">Special Capabilities</label>
          <textarea {...register('specialCapabilities')} className="input w-full min-h-[40px]" placeholder="e.g., Can handle oversized items" />
          {errors.specialCapabilities && <span className="text-red-500 text-xs">{errors.specialCapabilities.message}</span>}
        </div>
        <div className="md:col-span-3 xl:col-span-4">
          <label className="block font-medium">Limitations</label>
          <textarea {...register('limitations')} className="input w-full min-h-[40px]" placeholder="e.g., Not suitable for wet processes" />
          {errors.limitations && <span className="text-red-500 text-xs">{errors.limitations.message}</span>}
        </div>
        <div className="md:col-span-3 xl:col-span-4">
          <label className="block font-medium">Note</label>
          <textarea {...register('note')} className="input w-full min-h-[40px]" placeholder="Any additional notes..." />
          {errors.note && <span className="text-red-500 text-xs">{errors.note.message}</span>}
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="button" variant="outline" onClick={() => reset()} disabled={isLoading}>Reset</Button>
        <Button type="submit" disabled={isLoading} className="bg-indigo-600 text-white">Save</Button>
      </div>
    </form>
  );
} 