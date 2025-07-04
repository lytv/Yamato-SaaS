/**
 * PlanDetails Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main plandetail management page integrating PlanDetailList and PlanDetailForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PlanDetailForm } from '@/features/plandetail/PlanDetailForm';
import { PlanDetailList } from '@/features/plandetail/PlanDetailList';
import { usePlanDetailMutations } from '@/hooks/usePlanDetailMutations';
import type { PlanDetail } from '@/types/plandetail';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  plandetail?: PlanDetail;
};

/**
 * Modal component for create/edit forms
 */
function PlanDetailModal({
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
            {modal.mode === 'create' ? 'Create PlanDetail' : 'Edit PlanDetail'}
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

        <PlanDetailForm
          plandetail={modal.plandetail}
          onSuccess={(_plandetail) => {
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
 * Main PlanDetails dashboard page component
 */
export default function PlanDetailsPage(): JSX.Element {
  const t = useTranslations();
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { isCreating } = usePlanDetailMutations();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreatePlanDetail = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditPlanDetail = (plandetail: PlanDetail) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      plandetail,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    // Trigger a refresh of the plandetail list
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = (_plandetail: PlanDetail) => {
    // Trigger a refresh after successful delete
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Page Header */}
      <header data-testid="plandetails-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('plandetail.pageTitle', { default: 'PlanDetails' })}
            </h1>
            <p className="text-muted-foreground">
              {t('plandetail.pageDescription', {
                default: 'Manage your plandetails and inventory',
              })}
            </p>
          </div>

          <Button
            onClick={handleCreatePlanDetail}
            disabled={isCreating}
            className="shrink-0"
          >
            {t('plandetail.createNew', { default: 'Create PlanDetail' })}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div
        data-testid="plandetails-content"
        className="space-y-6"
      >
        {/* Responsive Layout Indicators */}
        {isMobile
          ? (
              <div data-testid="plandetails-mobile-layout" className="sr-only">
                Mobile Layout
              </div>
            )
          : (
              <div data-testid="plandetails-desktop-layout" className="sr-only">
                Desktop Layout
              </div>
            )}

        <PlanDetailList
          key={refreshKey}
          onEdit={handleEditPlanDetail}
          onDelete={handleDeleteSuccess}
        />
      </div>

      {/* Modal */}
      <PlanDetailModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </main>
  );
}
