/**
 * ProductSubs Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main productsub management page integrating ProductSubList and ProductSubForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ProductSubForm } from '@/features/productsub/ProductSubForm';
import { ProductSubList } from '@/features/productsub/ProductSubList';
import { useProductSubMutations } from '@/hooks/useProductSubMutations';
import type { ProductSub } from '@/types/productsub';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  productsub?: ProductSub;
};

/**
 * Modal component for create/edit forms
 */
function ProductSubModal({
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
            {modal.mode === 'create' ? 'Create ProductSub' : 'Edit ProductSub'}
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

        <ProductSubForm
          productsub={modal.productsub}
          onSuccess={(_productsub) => {
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
 * Main ProductSubs dashboard page component
 */
export default function ProductSubsPage(): JSX.Element {
  const t = useTranslations();
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { isCreating } = useProductSubMutations();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreateProductSub = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditProductSub = (productsub: ProductSub) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      productsub,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    // Trigger a refresh of the productsub list
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = (_productsub: ProductSub) => {
    // Trigger a refresh after successful delete
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Page Header */}
      <header data-testid="productsubs-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('productsub.pageTitle', { default: 'ProductSubs' })}
            </h1>
            <p className="text-muted-foreground">
              {t('productsub.pageDescription', {
                default: 'Manage your productsubs and inventory',
              })}
            </p>
          </div>

          <Button
            onClick={handleCreateProductSub}
            disabled={isCreating}
            className="shrink-0"
          >
            {t('productsub.createNew', { default: 'Create ProductSub' })}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div
        data-testid="productsubs-content"
        className="space-y-6"
      >
        {/* Responsive Layout Indicators */}
        {isMobile
          ? (
              <div data-testid="productsubs-mobile-layout" className="sr-only">
                Mobile Layout
              </div>
            )
          : (
              <div data-testid="productsubs-desktop-layout" className="sr-only">
                Desktop Layout
              </div>
            )}

        <ProductSubList
          key={refreshKey}
          onEdit={handleEditProductSub}
          onDelete={handleDeleteSuccess}
        />
      </div>

      {/* Modal */}
      <ProductSubModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </main>
  );
}
