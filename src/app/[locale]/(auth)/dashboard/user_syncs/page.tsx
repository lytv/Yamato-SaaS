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
      className="fixed inset-0 z-50 flex items-center justify-center duration-300 animate-in fade-in"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm duration-300 animate-in fade-in"
        onClick={handleBackdropClick}
        data-testid="modal-backdrop"
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
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
    <main className="container mx-auto max-w-7xl space-y-8 p-6">
      {/* Page Header */}
      <header data-testid="user_syncs-header" className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 p-8 text-white shadow-lg">
        <div className="flex flex-col items-start justify-between space-y-4 lg:flex-row lg:items-center lg:space-y-0">
          <div className="flex-1">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">
              {t('userSync.pageTitle', { default: 'User Syncs' })}
            </h1>
            <p className="text-lg text-blue-100">
              {t('userSync.pageDescription', {
                default: 'Manage user synchronization and maintain your user base',
              })}
            </p>
            <div className="mt-4 flex items-center space-x-6 text-sm text-blue-100">
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-green-400"></div>
                {t('userSync.features.realTimeSync', { default: 'Real-time sync' })}
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-yellow-400"></div>
                {t('userSync.features.autoGeneratedIds', { default: 'Auto-generated IDs' })}
              </div>
              <div className="flex items-center">
                <div className="mr-2 size-2 rounded-full bg-pink-400"></div>
                {t('userSync.features.roleManagement', { default: 'Role management' })}
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateUserSync}
            disabled={isCreating}
            className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 shadow-md transition-all duration-200 hover:scale-105 hover:bg-blue-50 disabled:transform-none"
          >
            <span className="mr-2 text-lg">+</span>
            {t('userSync.createNew', { default: 'Create New User' })}
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
