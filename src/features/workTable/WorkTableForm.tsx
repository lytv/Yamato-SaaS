import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { WorkTableFormSchema } from '@/libs/validations/workTable';
import type { WorkTableFormData } from '@/types/workTable';

const TABLE_TYPES = [
  'cutting',
  'sewing',
  'embroidery',
  'packing',
  'quality_control',
  'other',
];

type WorkTableFormProps = {
  initialValues?: Partial<WorkTableFormData>;
  onSubmit: (data: WorkTableFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
  isEditMode?: boolean;
};

export function WorkTableForm({ initialValues, onSubmit, onCancel, isLoading, title = 'Create Work Table', isEditMode = false }: WorkTableFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkTableFormData>({
    resolver: zodResolver(WorkTableFormSchema),
    defaultValues: initialValues,
  });

  // Reset form when initialValues change (switching between create/edit modes)
  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  // Responsive: 2 cột trên md+, 1 cột mobile
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`w-full max-w-5xl rounded-lg bg-white p-6 ${isEditMode ? 'border-2 border-blue-500 bg-blue-50' : 'border border-gray-200'}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={`text-xl font-bold ${isEditMode ? 'text-blue-700' : ''}`}>{title}</h2>
        {isEditMode && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            Editing Mode
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        <div>
          <label htmlFor="tableCode" className="block font-medium">
            Table Code
            <span className="text-red-500">*</span>
          </label>
          <input id="tableCode" {...register('tableCode')} className="input w-full" placeholder="e.g., TBL-001" />
          {errors.tableCode && <span className="text-xs text-red-500">{errors.tableCode.message}</span>}
        </div>
        <div>
          <label htmlFor="tableName" className="block font-medium">
            Table Name
            <span className="text-red-500">*</span>
          </label>
          <input id="tableName" {...register('tableName')} className="input w-full" placeholder="Enter table name" />
          {errors.tableName && <span className="text-xs text-red-500">{errors.tableName.message}</span>}
        </div>
        <div>
          <label htmlFor="tableDetail" className="block font-medium">Table Detail</label>
          <input id="tableDetail" {...register('tableDetail')} className="input w-full" placeholder="e.g., Bàn 1, Bàn 2" />
          {errors.tableDetail && <span className="text-xs text-red-500">{errors.tableDetail.message}</span>}
        </div>
        <div>
          <label htmlFor="tableType" className="block font-medium">Table Type</label>
          <select id="tableType" {...register('tableType')} className="input w-full">
            <option value="">Select type</option>
            {TABLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.tableType && <span className="text-xs text-red-500">{errors.tableType.message}</span>}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="button" variant="outline" onClick={() => reset()} disabled={isLoading}>Reset</Button>
        <Button type="submit" disabled={isLoading} className="bg-indigo-600 text-white">Save</Button>
      </div>
    </form>
  );
}
