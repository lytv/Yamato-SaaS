/**
 * Processs Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main process management page integrating ProcessList and ProcessForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ProcessForm } from '@/features/process/ProcessForm';
import { ProcessList } from '@/features/process/ProcessList';
import { useProcessMutations } from '@/hooks/useProcessMutations';
import type { Process } from '@/types/process';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  process?: Process;
};

/**
 * Modal component for create/edit forms
 */
function ProcessModal({
  modal,
  onClose,
  onSuccess,
}: {
  modal: ModalState;
  onClose: () => void;
  onSuccess: () => void;
}) {
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
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-semibold">
            {modal.mode === 'create' ? 'Create Process' : 'Edit Process'}
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

        <ProcessForm
          process={modal.process}
          onSuccess={(_process) => {
            onSuccess();
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

/**
 * Main Processs dashboard page component
 */
export default function ProcesssPage(): JSX.Element {
  const t = useTranslations();
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { isCreating } = useProcessMutations();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreateProcess = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditProcess = (process: Process) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      process,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    // Trigger a refresh of the process list
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = (_process: Process) => {
    // Trigger a refresh after successful delete
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Page Header */}
      <header data-testid="processs-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('process.pageTitle', { default: 'Processs' })}
            </h1>
            <p className="text-muted-foreground">
              {t('process.pageDescription', {
                default: 'Manage your processs and inventory',
              })}
            </p>
          </div>

          <Button
            onClick={handleCreateProcess}
            disabled={isCreating}
            className="shrink-0"
          >
            {t('process.createNew', { default: 'Create Process' })}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div
        data-testid="processs-content"
        className="space-y-6"
      >
        {/* Responsive Layout Indicators */}
        {isMobile
          ? (
              <div data-testid="processs-mobile-layout" className="sr-only">
                Mobile Layout
              </div>
            )
          : (
              <div data-testid="processs-desktop-layout" className="sr-only">
                Desktop Layout
              </div>
            )}

        <ProcessList
          key={refreshKey}
          onEdit={handleEditProcess}
          onDelete={handleDeleteSuccess}
        />
      </div>

      {/* Modal */}
      <ProcessModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </main>
  );
}
