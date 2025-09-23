/**
 * ProductSubs Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main productsub management page integrating ProductSubList and ProductSubForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { Layers, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ProductSubForm } from '@/features/productsub/ProductSubForm';
import { ProductSubImportModal } from '@/features/productsub/ProductSubImportModal';
import { ProductSubList } from '@/features/productsub/ProductSubList';
import { useProductSubMutations } from '@/hooks/useProductSubMutations';
import type { ImportResult } from '@/types/import';
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
      <div className="relative mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
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
  const [importModalOpen, setImportModalOpen] = useState(false);
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

  const handleImportSuccess = (_result: ImportResult) => {
    // Trigger a refresh after successful import
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = (_productsub: ProductSub) => {
    // Trigger a refresh after successful delete
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-7xl space-y-8 p-6">
      {/* Hero Header */}
      <header className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-700 p-8 text-white shadow-lg" data-testid="productsubs-header">
        <div className="flex flex-col items-start justify-between space-y-4 lg:flex-row lg:items-center lg:space-y-0">
          <div className="flex-1">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">
              {t('productsub.pageTitle', { default: 'Product Subs' })}
            </h1>
            <p className="text-lg text-purple-100">
              {t('productsub.pageDescription', {
                default: 'Manage your product subs and inventory with advanced tools',
              })}
            </p>
            {/* Feature indicators */}
            <div className="mt-4 flex items-center space-x-6 text-sm text-purple-100">
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-green-400"></div>
                Sub-Product Management
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-yellow-400"></div>
                Inventory Tracking
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-blue-400"></div>
                Category Organization
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => setImportModalOpen(true)}
              className="rounded-lg border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-white/20"
            >
              <Upload className="mr-2 size-5" />
              {t('productsub.import', { default: 'Import from YMT Plan' })}
            </Button>
            <Button
              onClick={handleCreateProductSub}
              disabled={isCreating}
              className="rounded-lg bg-white px-6 py-3 font-semibold text-purple-600 shadow-md transition-all duration-200 hover:scale-105 hover:bg-purple-50"
            >
              <Layers className="mr-2 size-5" />
              {t('productsub.createNew', { default: 'Create Product Sub' })}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-8 rounded-xl bg-gradient-to-br from-slate-50 to-purple-50 p-6">
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

      {/* Modals */}
      <ProductSubModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />

      {/* Import Modal */}
      <ProductSubImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </main>
  );
}
