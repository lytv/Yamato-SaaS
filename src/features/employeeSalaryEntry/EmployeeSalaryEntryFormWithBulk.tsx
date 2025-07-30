/**
 * EmployeeSalaryEntry Form with Bulk Option
 * Allows users to choose between single entry or bulk entry creation
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { EmployeeSalaryEntryForm } from './EmployeeSalaryEntryForm';
import { EmployeeSalaryEntryBulkForm } from './EmployeeSalaryEntryBulkForm';
import type { EmployeeSalaryEntryWithRelations, EmployeeSalaryEntryFormData } from '@/types/employeeSalaryEntry';

type FormMode = 'single' | 'bulk';

type EmployeeSalaryEntryFormWithBulkProps = {
  employeeSalaryEntry?: EmployeeSalaryEntryWithRelations;
  onSubmit?: (data: EmployeeSalaryEntryFormData) => Promise<void>;
  onSuccess?: (employeeSalaryEntry?: EmployeeSalaryEntryWithRelations) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
};

export function EmployeeSalaryEntryFormWithBulk({
  employeeSalaryEntry,
  onSubmit,
  onSuccess,
  onCancel,
  mode = 'create',
}: EmployeeSalaryEntryFormWithBulkProps) {
  const [formMode, setFormMode] = useState<FormMode>('bulk');
  const t = useTranslations('employeeSalaryEntry');

  // If editing, only show single form
  if (mode === 'edit') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">
            ✏️ {t('edit_title')}
          </h2>
        </div>
        <EmployeeSalaryEntryForm
          employeeSalaryEntry={employeeSalaryEntry}
          onSubmit={onSubmit || (async (data) => {
            console.log('Single form data:', data);
          })}
          mode="edit"
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </div>
    );
  }

  // Create mode - show mode selector
  return (
    <div className="max-h-[95vh] overflow-hidden">
      {formMode === 'single' ? (
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">
                📝 {t('create_title')}
              </h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormMode('bulk')}
                className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                🔢 {t('bulk.createSalaryEntry')}
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              {t('create_desc')}
            </p>
          </div>
          
          <EmployeeSalaryEntryForm
            employeeSalaryEntry={employeeSalaryEntry}
            onSubmit={onSubmit || (async (data) => {
              console.log('Single form data:', data);
            })}
            mode="create"
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </div>
      ) : (
        <div className="relative">          
          <EmployeeSalaryEntryBulkForm
            onSuccess={() => {
              if (onSuccess) {
                onSuccess();
              }
            }}
            onCancel={() => {
              if (onCancel) {
                onCancel();
              }
            }}
          />
        </div>
      )}
    </div>
  );
}