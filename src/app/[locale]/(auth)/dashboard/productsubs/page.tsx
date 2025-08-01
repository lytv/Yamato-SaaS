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
      <div className="relative mx-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
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
      <header className="bg-gradient-to-r from-purple-600 to-pink-700 rounded-xl p-8 text-white shadow-lg" data-testid="productsubs-header">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {t('productsub.pageTitle', { default: 'Product Subs' })}
            </h1>
            <p className="text-purple-100 text-lg">
              {t('productsub.pageDescription', {
                default: 'Manage your product subs and inventory with advanced tools',
              })}
            </p>
            {/* Feature indicators */}
            <div className="flex items-center space-x-6 mt-4 text-sm text-purple-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                Sub-Product Management
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                Inventory Tracking
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                Category Organization
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setImportModalOpen(true)}
              className="bg-white/10 text-white border border-white/20 hover:bg-white/20 font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
            >
              <Upload className="w-5 h-5 mr-2" />
              {t('productsub.import', { default: 'Import from YMT Plan' })}
            </Button>
            <Button
              onClick={handleCreateProductSub}
              disabled={isCreating}
              className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
            >
              <Layers className="w-5 h-5 mr-2" />
              {t('productsub.createNew', { default: 'Create Product Sub' })}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-8 bg-gradient-to-br from-slate-50 to-purple-50 p-6 rounded-xl">
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
