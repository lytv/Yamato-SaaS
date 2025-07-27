/**
 * Plans Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main plan management page integrating PlanList and PlanForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { CalendarDays } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
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
      <div className="relative mx-4 w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-xl shadow-2xl">
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
    <main className="container mx-auto max-w-7xl space-y-8 p-6">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-8 text-white shadow-lg" data-testid="plans-header">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {t('plan.pageTitle', { default: 'Production Plans' })}
            </h1>
            <p className="text-green-100 text-lg">
              {t('plan.pageDescription', {
                default: 'Quản lý kế hoạch sản xuất và lịch trình với công cụ hiện đại',
              })}
            </p>
            {/* Feature indicators */}
            <div className="flex items-center space-x-6 mt-4 text-sm text-green-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                Production Planning
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                Schedule Management
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                Progress Tracking
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <Button
            onClick={handleCreatePlan}
            disabled={isCreating}
            className="bg-white text-green-600 hover:bg-green-50 font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
          >
            <CalendarDays className="w-5 h-5 mr-2" />
            {t('plan.createNew', { default: 'Create Plan' })}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-8 bg-gradient-to-br from-slate-50 to-green-50 p-6 rounded-xl">
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
