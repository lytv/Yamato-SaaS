/**
 * Plans Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main plan management page integrating PlanList and PlanForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { CalendarDays, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PlanForm } from '@/features/plan/PlanForm';
import { PlanImportModal } from '@/features/plan/PlanImportModal';
import { PlanList } from '@/features/plan/PlanList';
import { usePlanMutations } from '@/hooks/usePlanMutations';
import type { ImportResult } from '@/types/import';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm duration-300 animate-in fade-in"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={handleBackdropClick}
        data-testid="modal-backdrop"
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative mx-4 max-h-[90vh] w-full max-w-5xl overflow-y-auto duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
        <div className="rounded-xl bg-white shadow-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </Button>

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };

  const handleImportClose = () => {
    setIsImportModalOpen(false);
  };

  const handleImportSuccess = (_result: ImportResult) => {
    // Refresh the list after successful import
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-7xl space-y-8 p-6">
      {/* Hero Header */}
      <header className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 p-8 text-white shadow-lg" data-testid="plans-header">
        <div className="flex flex-col items-start justify-between space-y-4 lg:flex-row lg:items-center lg:space-y-0">
          <div className="flex-1">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">
              {t('plan.pageTitle', { default: 'Production Plans' })}
            </h1>
            <p className="text-lg text-green-100">
              {t('plan.pageDescription', {
                default: 'Quản lý kế hoạch sản xuất và lịch trình với công cụ hiện đại',
              })}
            </p>
            {/* Feature indicators */}
            <div className="mt-4 flex items-center space-x-6 text-sm text-green-100">
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-yellow-400"></div>
                Production Planning
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-blue-400"></div>
                Schedule Management
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-purple-400"></div>
                Progress Tracking
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="space-y-3">
            <Button
              onClick={handleCreatePlan}
              disabled={isCreating}
              className="w-full rounded-lg bg-white px-6 py-3 font-semibold text-green-600 shadow-md transition-all duration-200 hover:scale-105 hover:bg-green-50 lg:w-auto"
            >
              <CalendarDays className="mr-2 size-5" />
              {t('plan.createNew', { default: 'Create Plan' })}
            </Button>
            <Button
              onClick={handleImportClick}
              className="w-full rounded-lg bg-green-500 px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-green-400 lg:ml-3 lg:w-auto"
            >
              <Upload className="mr-2 size-5" />
              Import từ YMT Plan
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-8 rounded-xl bg-gradient-to-br from-slate-50 to-green-50 p-6">
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

      {/* Import Modal */}
      <PlanImportModal
        isOpen={isImportModalOpen}
        onClose={handleImportClose}
        onSuccess={handleImportSuccess}
      />
    </main>
  );
}
