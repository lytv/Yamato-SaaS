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
  const t = useTranslations('employeeSalaryEntry');

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

      {/* Enhanced Modal content */}
      <div className="fixed inset-0 z-10 flex size-full max-w-none flex-col overflow-auto bg-gradient-to-br from-blue-50 to-purple-50 p-0">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold">
{modal.mode === 'create' ? t('create_title') : t('edit_title')}
                </h2>
                <p className="text-xl text-white/90">
{modal.mode === 'create' ? t('create_desc') : t('edit_desc')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors duration-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
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
    </div>
  );
}

/**
 * Main EmployeeSalaryEntrys dashboard page component
 */
export default function EmployeeSalaryEntrysPage(): JSX.Element {
  const t = useTranslations('employeeSalaryEntry');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="container mx-auto max-w-7xl space-y-6 p-6">
        {/* Enhanced Page Header with Gradient Background */}
        <header data-testid="employeeSalaryEntrys-header" className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-3">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">
                    💰 {t('pageTitle')}
                  </h1>
                  <p className="text-xl text-white/90">
                    {t('pageDescription')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCreateEmployeeSalaryEntry}
                disabled={isCreating}
                size="lg"
                className="h-14 bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg px-8 shadow-lg border-0"
              >
                <svg className="mr-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
{t('createNew')}
              </Button>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10"></div>
          <div className="absolute -left-16 -bottom-16 h-32 w-32 rounded-full bg-white/5"></div>
        </header>

        {/* Enhanced Main Content */}
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

          {/* Enhanced Data Table Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <EmployeeSalaryEntryList
              key={refreshKey}
              onEdit={handleEditEmployeeSalaryEntry}
              onDelete={handleDeleteSuccess}
            />
          </div>
        </div>

      {/* Modal */}
      <EmployeeSalaryEntryModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
      </main>
    </div>
  );
}
