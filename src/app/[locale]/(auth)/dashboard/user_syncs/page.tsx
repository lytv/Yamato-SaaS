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
      className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleBackdropClick}
        data-testid="modal-backdrop"
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
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
      <header data-testid="user_syncs-header" className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {t('userSync.pageTitle', { default: 'User Syncs' })}
            </h1>
            <p className="text-blue-100 text-lg">
              {t('userSync.pageDescription', {
                default: 'Manage user synchronization and maintain your user base',
              })}
            </p>
            <div className="flex items-center space-x-6 mt-4 text-sm text-blue-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                {t('userSync.features.realTimeSync', { default: 'Real-time sync' })}
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                {t('userSync.features.autoGeneratedIds', { default: 'Auto-generated IDs' })}
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
                {t('userSync.features.roleManagement', { default: 'Role management' })}
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateUserSync}
            disabled={isCreating}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            <span className="text-lg mr-2">+</span>
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
