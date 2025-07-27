import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Table, FileText, Tag, AlertCircle, RefreshCw, Settings } from 'lucide-react';

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
    <div className="bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 p-6 rounded-xl">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Form Header */}
        <div className="text-center pb-6 border-b border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Table className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Table Code Field */}
            <div className="space-y-2">
              <label
                htmlFor="tableCode"
                className="flex items-center text-sm font-medium text-gray-700"
              >
                <Settings className="w-4 h-4 mr-2 text-purple-500" />
                {t('table_code_label') || 'Table Code'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="tableCode"
                type="text"
                {...register('tableCode')}
                aria-required="true"
                aria-describedby={errors.tableCode ? 'tableCode-error' : undefined}
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.tableCode 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300 focus:border-purple-500'
                }`}
                placeholder={t('table_code_placeholder') || 'Enter table code (e.g., WT001)'}
              />
              {errors.tableCode && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="w-3 h-3" />
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
                <FileText className="w-4 h-4 mr-2 text-purple-500" />
                {t('table_name_label') || 'Table Name'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id="tableName"
                type="text"
                {...register('tableName')}
                aria-required="true"
                aria-describedby={errors.tableName ? 'tableName-error' : undefined}
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.tableName 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300 focus:border-purple-500'
                }`}
                placeholder={t('table_name_placeholder') || 'Enter table name'}
              />
              {errors.tableName && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="w-3 h-3" />
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
                <Tag className="w-4 h-4 mr-2 text-purple-500" />
                {t('table_type_label') || 'Table Type'}
              </label>
              <select
                id="tableType"
                {...register('tableType')}
                aria-describedby={errors.tableType ? 'tableType-error' : undefined}
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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
                  <AlertCircle className="w-3 h-3" />
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
              <FileText className="w-4 h-4 mr-2 text-purple-500" />
              {t('table_detail_label') || 'Table Details'}
            </label>
            <textarea
              id="tableDetail"
              rows={4}
              {...register('tableDetail')}
              aria-describedby={errors.tableDetail ? 'tableDetail-error' : undefined}
              className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${
                errors.tableDetail 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300 focus:border-purple-500'
              }`}
              placeholder={t('table_detail_placeholder') || 'Enter detailed table description, specifications, etc.'}
            />
            {errors.tableDetail && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-3 h-3" />
                {errors.tableDetail.message}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              {t('cancel') || 'Cancel'}
            </button>

            <button
              type="button"
              onClick={() => reset()}
              disabled={isLoading}
              className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              {t('reset') || 'Reset'}
            </button>

            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading && (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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
