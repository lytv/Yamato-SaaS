/**
 * Production Steps Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main production step management page integrating ProductionStepList and ProductionStepForm components
 * Following Yamato-SaaS patterns and products page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ProductionStepForm } from '@/features/productionStep/ProductionStepForm';
import { ProductionStepList } from '@/features/productionStep/ProductionStepList';
import { useProductionStepMutations } from '@/hooks/useProductionStepMutations';
import type { ProductionStep } from '@/types/productionStep';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  productionStep?: ProductionStep;
};

/**
 * Modal component for create/edit forms
 */
function ProductionStepModal({
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
            {modal.mode === 'create' ? 'Create Production Step' : 'Edit Production Step'}
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

        <ProductionStepForm
          productionStep={modal.productionStep}
          onSuccess={(_productionStep) => {
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
 * Main Production Steps dashboard page component
 */
export default function ProductionStepsPage(): JSX.Element {
  const t = useTranslations();
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { isCreating } = useProductionStepMutations();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreateProductionStep = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditProductionStep = (productionStep: ProductionStep) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      productionStep,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    // Trigger a refresh of the production step list
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = (_productionStep: ProductionStep) => {
    // Trigger a refresh after successful delete
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Page Header */}
      <header data-testid="production-steps-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('productionStep.pageTitle', { default: 'Production Steps' })}
            </h1>
            <p className="text-muted-foreground">
              {t('productionStep.pageDescription', {
                default: 'Manage your production steps and workflow',
              })}
            </p>
          </div>

          <Button
            onClick={handleCreateProductionStep}
            disabled={isCreating}
            className="shrink-0"
          >
            {t('productionStep.createNew', { default: 'Create Production Step' })}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div
        data-testid="production-steps-content"
        className="space-y-6"
      >
        {/* Responsive Layout Indicators */}
        {isMobile
          ? (
              <div data-testid="production-steps-mobile-layout" className="sr-only">
                Mobile Layout
              </div>
            )
          : (
              <div data-testid="production-steps-desktop-layout" className="sr-only">
                Desktop Layout
              </div>
            )}

        <ProductionStepList
          key={refreshKey}
          onEdit={handleEditProductionStep}
          onDelete={handleDeleteSuccess}
        />
      </div>

      {/* Modal */}
      <ProductionStepModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </main>
  );
}
