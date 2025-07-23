/**
 * Production Step Details Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main page for managing production step details with modal-based CRUD operations
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ProductionStepDetailForm } from '@/features/productionStepDetail/ProductionStepDetailForm';
import { ProductionStepDetailList } from '@/features/productionStepDetail/ProductionStepDetailList';
import { PriceImportModal } from '@/features/productionStep/PriceImportModal';
import { useProductionStepDetailMutations } from '@/hooks/useProductionStepDetailMutations';
import type { ProductionStepDetail } from '@/types/productionStepDetail';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  productionStepDetail?: ProductionStepDetail;
};

/**
 * Modal component for create/edit forms
 */
function ProductionStepDetailModal({
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

  const t = useTranslations('productionStepDetail.form');

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
      <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-semibold">
            {modal.mode === 'create' ? t('title') : t('edit_title')}
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

        <ProductionStepDetailForm
          productionStepDetail={modal.productionStepDetail}
          onSuccess={(_productionStepDetail) => {
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
 * Main dashboard page component
 */
export default function ProductionStepDetailsPage(): JSX.Element {
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { isCreating } = useProductionStepDetailMutations();
  const t = useTranslations('productionStepDetail.page');

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreateProductionStepDetail = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              {t('title')}
            </h1>
            <p className="mt-2 max-w-4xl text-sm text-gray-500">
              {t('description')}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 sm:ml-4 sm:mt-0">
            <Button
              onClick={handleCreateProductionStepDetail}
              disabled={isCreating}
              size={isMobile ? 'sm' : 'default'}
              className="w-full sm:w-auto"
            >
              {isMobile ? t('add_detail_mobile') : t('add_detail')}
            </Button>
            <a href="/dashboard/production-step-details/multi-assign">
              <Button
                variant="outline"
                size={isMobile ? 'sm' : 'default'}
                className="w-full sm:w-auto"
              >
                {isMobile ? t('bulk_add_mobile') : t('bulk_add')}
              </Button>
            </a>
            <Button
              onClick={() => setShowImportModal(true)}
              variant="outline"
              size={isMobile ? 'sm' : 'default'}
              className="w-full sm:w-auto bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
            >
              📊 {isMobile ? 'Import giá' : 'Import đơn giá'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <ProductionStepDetailList
          key={refreshKey}
        />
      </div>

      {/* Modal */}
      <ProductionStepDetailModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* Price Import Modal */}
      <PriceImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
