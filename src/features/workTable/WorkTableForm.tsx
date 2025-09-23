import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, FileText, RefreshCw, Settings, Table, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

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

export function WorkTableForm({ initialValues, onSubmit, onCancel, isLoading, isEditMode = false }: WorkTableFormProps) {
  const t = useTranslations('workTable.form');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<WorkTableFormData>({
    resolver: zodResolver(WorkTableFormSchema),
    defaultValues: initialValues,
    mode: 'onChange',
  });

  // Reset form when initialValues change (switching between create/edit modes)
  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <div className="rounded-xl bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Form Header */}
        <div className="border-b border-gray-200 pb-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600">
            <Table className="size-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {isEditMode ? (t('updateWorkTable') || 'Edit Work Table') : (t('createWorkTable') || 'Create Work Table')}
          </h2>
          <p className="text-gray-600">
            {isEditMode
              ? (t('updateWorkTableDescription') || 'Update work table configuration and specifications')
              : (t('workTableDescription') || 'Define a new work table with detailed specifications')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Main Fields Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Table Code Field */}
            <div className="space-y-2">
              <label
                htmlFor="tableCode"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                <Settings className="mr-2 size-4 text-purple-500" />
                {t('table_code_label') || 'Table Code'}
                <span className="ml-1 text-red-500">*</span>
              </label>
              <input
                id="tableCode"
                type="text"
                {...register('tableCode')}
                aria-required="true"
                aria-describedby={errors.tableCode ? 'tableCode-error' : undefined}
                className={`w-full rounded-lg border px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.tableCode
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 focus:border-purple-500'
                }`}
                placeholder={t('table_code_placeholder') || 'Enter table code (e.g., WT001)'}
              />
              {errors.tableCode && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="size-3" />
                  {errors.tableCode.message}
                </div>
              )}
            </div>

            {/* Table Name Field */}
            <div className="space-y-2">
              <label
                htmlFor="tableName"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                <FileText className="mr-2 size-4 text-purple-500" />
                {t('table_name_label') || 'Table Name'}
                <span className="ml-1 text-red-500">*</span>
              </label>
              <input
                id="tableName"
                type="text"
                {...register('tableName')}
                aria-required="true"
                aria-describedby={errors.tableName ? 'tableName-error' : undefined}
                className={`w-full rounded-lg border px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.tableName
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 focus:border-purple-500'
                }`}
                placeholder={t('table_name_placeholder') || 'Enter table name'}
              />
              {errors.tableName && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="size-3" />
                  {errors.tableName.message}
                </div>
              )}
            </div>

            {/* Table Type Field */}
            <div className="space-y-2">
              <label
                htmlFor="tableType"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                <Tag className="mr-2 size-4 text-purple-500" />
                {t('table_type_label') || 'Table Type'}
              </label>
              <select
                id="tableType"
                {...register('tableType')}
                aria-describedby={errors.tableType ? 'tableType-error' : undefined}
                className={`w-full rounded-lg border px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.tableType
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 focus:border-purple-500'
                }`}
              >
                <option value="">{t('select_type') || 'Select table type'}</option>
                {TABLE_TYPES.map(tType => (
                  <option key={tType} value={tType}>
                    {t(`type_${tType}`) || tType}
                  </option>
                ))}
              </select>
              {errors.tableType && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="size-3" />
                  {errors.tableType.message}
                </div>
              )}
            </div>
          </div>

          {/* Table Detail Field */}
          <div className="space-y-2">
            <label
              htmlFor="tableDetail"
              className="flex items-center text-sm font-medium text-gray-700"
            >
              <FileText className="mr-2 size-4 text-purple-500" />
              {t('table_detail_label') || 'Table Details'}
            </label>
            <textarea
              id="tableDetail"
              rows={4}
              {...register('tableDetail')}
              aria-describedby={errors.tableDetail ? 'tableDetail-error' : undefined}
              className={`w-full resize-none rounded-lg border px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.tableDetail
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 focus:border-purple-500'
              }`}
              placeholder={t('table_detail_placeholder') || 'Enter detailed table description, specifications, etc.'}
            />
            {errors.tableDetail && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="size-3" />
                {errors.tableDetail.message}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
            >
              {t('cancel') || 'Cancel'}
            </button>

            <button
              type="button"
              onClick={() => reset()}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50"
            >
              {t('reset') || 'Reset'}
            </button>

            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:from-purple-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading && (
                <RefreshCw className="mr-2 size-4 animate-spin" />
              )}
              {isLoading
                ? isEditMode
                  ? (t('updating') || 'Updating...')
                  : (t('creating') || 'Creating...')
                : isEditMode
                  ? (t('update') || 'Update Work Table')
                  : (t('create') || 'Create Work Table')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
