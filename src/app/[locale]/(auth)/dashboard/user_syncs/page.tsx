/**
 * UserSyncs Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main user_sync management page integrating UserSyncList and UserSyncForm components
 * Following Yamato-SaaS patterns and todos page structure
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { UserSyncForm } from '@/features/user_sync/UserSyncForm';
import { UserSyncList } from '@/features/user_sync/UserSyncList';
import { useUserSyncMutations } from '@/hooks/useUserSyncMutations';
import type { UserSync } from '@/types/user_sync';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  user_sync?: UserSync;
};

/**
 * Modal component for create/edit forms
 */
function UserSyncModal({
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
            {modal.mode === 'create' ? 'Create UserSync' : 'Edit UserSync'}
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

        <UserSyncForm
          user_sync={modal.user_sync}
          onSuccess={(_user_sync) => {
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
 * Main UserSyncs dashboard page component
 */
export default function UserSyncsPage(): JSX.Element {
  const t = useTranslations();
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { isCreating } = useUserSyncMutations();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreateUserSync = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditUserSync = (user_sync: UserSync) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      user_sync,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    // Trigger a refresh of the user_sync list
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = (_user_sync: UserSync) => {
    // Trigger a refresh after successful delete
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Page Header */}
      <header data-testid="user_syncs-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('user_sync.pageTitle', { default: 'UserSyncs' })}
            </h1>
            <p className="text-muted-foreground">
              {t('user_sync.pageDescription', {
                default: 'Manage your user_syncs and inventory',
              })}
            </p>
          </div>

          <Button
            onClick={handleCreateUserSync}
            disabled={isCreating}
            className="shrink-0"
          >
            {t('user_sync.createNew', { default: 'Create UserSync' })}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div
        data-testid="user_syncs-content"
        className="space-y-6"
      >
        {/* Responsive Layout Indicators */}
        {isMobile
          ? (
              <div data-testid="user_syncs-mobile-layout" className="sr-only">
                Mobile Layout
              </div>
            )
          : (
              <div data-testid="user_syncs-desktop-layout" className="sr-only">
                Desktop Layout
              </div>
            )}

        <UserSyncList
          key={refreshKey}
          onEdit={handleEditUserSync}
          onDelete={handleDeleteSuccess}
        />
      </div>

      {/* Modal */}
      <UserSyncModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </main>
  );
}
