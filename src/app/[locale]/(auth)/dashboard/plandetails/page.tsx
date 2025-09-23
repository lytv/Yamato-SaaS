/**
 * PlanDetails Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main plandetail management page integrating PlanDetailList and PlanDetailForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { CalendarDays } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PlanDetailForm } from '@/features/plandetail/PlanDetailForm';
import { PlanDetailImportModal } from '@/features/plandetail/PlanDetailImportModal';
import { PlanDetailList } from '@/features/plandetail/PlanDetailList';
import { usePlanDetailMutations } from '@/hooks/usePlanDetailMutations';
import type { ImportPlanDetailResult, PlanDetail } from '@/types/plandetail';

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

  const handleImportSuccess = (_result: ImportPlanDetailResult) => {
    // Trigger a refresh after successful import
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-7xl space-y-8 p-6">
      {/* Hero Header */}
      <header className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-lg" data-testid="plandetails-header">
        <div className="flex flex-col items-start justify-between space-y-4 lg:flex-row lg:items-center lg:space-y-0">
          <div className="flex-1">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">
              {t('plandetail.pageTitle', { default: 'Plan Details' })}
            </h1>
            <p className="text-lg text-blue-100">
              {t('plandetail.pageDescription', {
                default: 'Chi tiết kế hoạch sản xuất và quản lý tiến độ thực hiện',
              })}
            </p>
            {/* Feature indicators */}
            <div className="mt-4 flex items-center space-x-6 text-sm text-blue-100">
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-yellow-400"></div>
                Plan Tracking
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-green-400"></div>
                Progress Monitoring
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-purple-400"></div>
                Resource Management
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <PlanDetailImportModal
              onSuccess={(result) => {
                handleImportSuccess(result);
              }}
              onError={(error) => {
                console.error('Import error:', error);
              }}
            />
            <Button
              onClick={handleCreatePlanDetail}
              disabled={isCreating}
              className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 shadow-md transition-all duration-200 hover:scale-105 hover:bg-blue-50"
            >
              <CalendarDays className="mr-2 size-5" />
              {t('plandetail.createNew', { default: 'Tạo mới Chi tiết kế hoạch' })}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-8 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 p-6">
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

      {/* Modals */}
      <PlanDetailModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

    </main>
  );
}
