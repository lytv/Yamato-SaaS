/**
 * EmployeeSalaryEntrys Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main employeeSalaryEntry management page integrating EmployeeSalaryEntryList and EmployeeSalaryEntryForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

import { EmployeeSalaryEntryFormWithBulk } from '@/features/employeeSalaryEntry/EmployeeSalaryEntryFormWithBulk';
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

      {/* Enhanced Modal content */}
      <div className="fixed inset-0 z-10 flex size-full max-w-none flex-col overflow-auto bg-gradient-to-br from-blue-50 to-purple-50 p-0">

        <div className="flex-1 overflow-auto">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <EmployeeSalaryEntryFormWithBulk
              employeeSalaryEntry={modal.employeeSalaryEntry}
              mode={modal.mode}
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
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

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

  const handlePaginationUpdate = (page: number, _total: number, hasMoreData: boolean) => {
    setCurrentPage(page);
    setHasMore(hasMoreData);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="container mx-auto max-w-7xl space-y-4 p-4">

        {/* Enhanced Main Content */}
        <div
          data-testid="employeeSalaryEntrys-content"
          className="space-y-2"
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
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <EmployeeSalaryEntryList
              key={refreshKey}
              onEdit={handleEditEmployeeSalaryEntry}
              onDelete={handleDeleteSuccess}
              currentPage={currentPage}
              onPaginationUpdate={handlePaginationUpdate}
              onCreateNew={handleCreateEmployeeSalaryEntry}
              isCreating={isCreating}
              currentPageState={currentPage}
              hasMoreState={hasMore}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
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
