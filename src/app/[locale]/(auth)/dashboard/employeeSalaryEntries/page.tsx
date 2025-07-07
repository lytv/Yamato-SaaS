/**
 * EmployeeSalaryEntrys Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main employeeSalaryEntry management page integrating EmployeeSalaryEntryList and EmployeeSalaryEntryForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmployeeSalaryEntryForm } from '@/features/employeeSalaryEntry/EmployeeSalaryEntryForm';
import { EmployeeSalaryEntryList } from '@/features/employeeSalaryEntry/EmployeeSalaryEntryList';
import { useEmployeeSalaryEntryMutations } from '@/hooks/useEmployeeSalaryEntryMutations';
import type { EmployeeSalaryEntryWithRelations } from '@/types/employeeSalaryEntry';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  employeeSalaryEntry?: EmployeeSalaryEntryWithRelations;
};

/**
 * Modal component for create/edit forms
 */
function EmployeeSalaryEntryModal({
  modal,
  onClose,
  onSuccess,
}: {
  modal: ModalState;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { createEmployeeSalaryEntry, updateEmployeeSalaryEntry } = useEmployeeSalaryEntryMutations();

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (data: any) => {
    if (modal.mode === 'edit' && modal.employeeSalaryEntry?.id) {
      await updateEmployeeSalaryEntry(modal.employeeSalaryEntry.id, data);
    } else {
      await createEmployeeSalaryEntry(data);
    }
    onSuccess();
    onClose();
  };

  if (!modal.isOpen) {
    return null;
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdropClick}
        data-testid="modal-backdrop"
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="fixed inset-0 z-10 flex size-full max-w-none flex-col overflow-auto bg-white p-0">
        <div className="flex items-center justify-between border-b p-6">
          <h2 id="modal-title" className="text-xl font-semibold">
            {modal.mode === 'create' ? 'Create EmployeeSalaryEntry' : 'Edit EmployeeSalaryEntry'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <EmployeeSalaryEntryForm
            employeeSalaryEntry={modal.employeeSalaryEntry}
            onSubmit={handleSubmit}
            onSuccess={(_employeeSalaryEntry) => {
              onSuccess();
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Main EmployeeSalaryEntrys dashboard page component
 */
export default function EmployeeSalaryEntrysPage(): JSX.Element {
  const t = useTranslations();
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { isCreating } = useEmployeeSalaryEntryMutations();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreateEmployeeSalaryEntry = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditEmployeeSalaryEntry = (employeeSalaryEntry: EmployeeSalaryEntryWithRelations) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      employeeSalaryEntry,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    // Trigger a refresh of the employeeSalaryEntry list
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = (_employeeSalaryEntry: EmployeeSalaryEntryWithRelations) => {
    // Trigger a refresh after successful delete
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Page Header */}
      <header data-testid="employeeSalaryEntrys-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('employeeSalaryEntry.pageTitle', { default: 'EmployeeSalaryEntrys' })}
            </h1>
            <p className="text-muted-foreground">
              {t('employeeSalaryEntry.pageDescription', {
                default: 'Manage your employeeSalaryEntrys and inventory',
              })}
            </p>
          </div>

          <Button
            onClick={handleCreateEmployeeSalaryEntry}
            disabled={isCreating}
            className="shrink-0"
          >
            {t('employeeSalaryEntry.createNew', { default: 'Create EmployeeSalaryEntry' })}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div
        data-testid="employeeSalaryEntrys-content"
        className="space-y-6"
      >
        {/* Responsive Layout Indicators */}
        {isMobile
          ? (
              <div data-testid="employeeSalaryEntrys-mobile-layout" className="sr-only">
                Mobile Layout
              </div>
            )
          : (
              <div data-testid="employeeSalaryEntrys-desktop-layout" className="sr-only">
                Desktop Layout
              </div>
            )}

        <EmployeeSalaryEntryList
          key={refreshKey}
          onEdit={handleEditEmployeeSalaryEntry}
          onDelete={handleDeleteSuccess}
        />
      </div>

      {/* Modal */}
      <EmployeeSalaryEntryModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </main>
  );
}
