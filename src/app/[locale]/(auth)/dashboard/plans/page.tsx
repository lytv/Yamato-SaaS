/**
 * Plans Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main plan management page integrating PlanList and PlanForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PlanForm } from '@/features/plan/PlanForm';
import { PlanList } from '@/features/plan/PlanList';
import { usePlanMutations } from '@/hooks/usePlanMutations';
import type { Plan } from '@/types/plan';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  plan?: Plan;
};

/**
 * Modal component for create/edit forms
 */
function PlanModal({
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
            {modal.mode === 'create' ? 'Create Plan' : 'Edit Plan'}
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

        <PlanForm
          plan={modal.plan}
          onSuccess={(_plan) => {
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
 * Main Plans dashboard page component
 */
export default function PlansPage(): JSX.Element {
  const t = useTranslations();
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { isCreating } = usePlanMutations();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreatePlan = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditPlan = (plan: Plan) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      plan,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    // Trigger a refresh of the plan list
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = (_plan: Plan) => {
    // Trigger a refresh after successful delete
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Page Header */}
      <header data-testid="plans-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('plan.pageTitle', { default: 'Plans' })}
            </h1>
            <p className="text-muted-foreground">
              {t('plan.pageDescription', {
                default: 'Manage your plans and inventory',
              })}
            </p>
          </div>

          <Button
            onClick={handleCreatePlan}
            disabled={isCreating}
            className="shrink-0"
          >
            {t('plan.createNew', { default: 'Create Plan' })}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div
        data-testid="plans-content"
        className="space-y-6"
      >
        {/* Responsive Layout Indicators */}
        {isMobile
          ? (
              <div data-testid="plans-mobile-layout" className="sr-only">
                Mobile Layout
              </div>
            )
          : (
              <div data-testid="plans-desktop-layout" className="sr-only">
                Desktop Layout
              </div>
            )}

        <PlanList
          key={refreshKey}
          onEdit={handleEditPlan}
          onDelete={handleDeleteSuccess}
        />
      </div>

      {/* Modal */}
      <PlanModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </main>
  );
}
