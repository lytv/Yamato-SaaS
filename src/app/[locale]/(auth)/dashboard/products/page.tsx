/**
 * Products Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main product management page integrating ProductList and ProductForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ProductForm } from '@/features/product/ProductForm';
import { ProductList } from '@/features/product/ProductList';
import { useProductMutations } from '@/hooks/useProductMutations';
import type { Product } from '@/types/product';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  product?: Product;
};

/**
 * Modal component for create/edit forms
 */
function ProductModal({
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

          <ProductForm
            product={modal.product}
            onSuccess={(_product) => {
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
 * Main Products dashboard page component
 */
export default function ProductsPage(): JSX.Element {
  const t = useTranslations();
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { isCreating } = useProductMutations();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreateProduct = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditProduct = (product: Product) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      product,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    // Trigger a refresh of the product list
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = (_product: Product) => {
    // Trigger a refresh after successful delete
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-7xl space-y-8 p-6">
      {/* Hero Header */}
      <header className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 p-8 text-white shadow-lg" data-testid="products-header">
        <div className="flex flex-col items-start justify-between space-y-4 lg:flex-row lg:items-center lg:space-y-0">
          <div className="flex-1">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">
              {t('product.pageTitle', { default: 'Products' })}
            </h1>
            <p className="text-lg text-blue-100">
              {t('product.pageDescription', {
                default: 'Manage your products and inventory with modern tools',
              })}
            </p>
            {/* Feature indicators */}
            <div className="mt-4 flex items-center space-x-6 text-sm text-blue-100">
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-green-400"></div>
                Product Management
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-yellow-400"></div>
                Category Organization
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-pink-400"></div>
                Inventory Tracking
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <Button
            onClick={handleCreateProduct}
            disabled={isCreating}
            className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 shadow-md transition-all duration-200 hover:scale-105 hover:bg-blue-50"
          >
            <Package className="mr-2 size-5" />
            {t('product.createNew', { default: 'Create Product' })}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-8 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        {/* Responsive Layout Indicators */}
        {isMobile
          ? (
              <div data-testid="products-mobile-layout" className="sr-only">
                Mobile Layout
              </div>
            )
          : (
              <div data-testid="products-desktop-layout" className="sr-only">
                Desktop Layout
              </div>
            )}

        <ProductList
          key={refreshKey}
          onEdit={handleEditProduct}
          onDelete={handleDeleteSuccess}
        />
      </div>

      {/* Modal */}
      <ProductModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </main>
  );
}
