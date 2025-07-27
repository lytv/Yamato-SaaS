/**
 * Processes Dashboard Page
 * Following TDD Workflow Standards - Green Phase
 * Main process management page integrating ProcessList and ProcessForm components
 * Following Modern UI Design System patterns
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Settings, Cog, Plus, FileText, BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProcessForm } from '@/features/process/ProcessForm';
import { ProcessList } from '@/features/process/ProcessList';
import { useProcessMutations } from '@/hooks/useProcessMutations';
import type { Process } from '@/types/process';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  process?: Process;
};

/**
 * Modal component for create/edit forms
 */
function ProcessModal({
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
      <div className="relative z-10 w-full max-w-5xl mx-4 rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                {modal.mode === 'create' ? 'Create Process' : 'Edit Process'}
              </h2>
              <p className="text-sm text-gray-500">
                {modal.mode === 'create' 
                  ? 'Define a new production process'
                  : 'Update process configuration'
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2"
            aria-label="Close"
          >
            <span className="text-lg">×</span>
          </Button>
        </div>

        <div className="p-6">
          <ProcessForm
            process={modal.process}
            onSuccess={(_process) => {
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
 * Main Processs dashboard page component
 */
export default function ProcesssPage(): JSX.Element {
  const t = useTranslations();
  const { userId: _userId, orgId: _orgId } = useAuth();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const { isCreating } = useProcessMutations();

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreateProcess = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditProcess = (process: Process) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      process,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    // Trigger a refresh of the process list
    setRefreshKey(prev => prev + 1);
  };

  const handleDeleteSuccess = (_process: Process) => {
    // Trigger a refresh after successful delete
    setRefreshKey(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 text-white">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-8 lg:mb-0">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Quản lý quy trình sản xuất
                  </h1>
                  <p className="text-slate-100 text-lg">
                    Định nghĩa và quản lý các quy trình sản xuất trong nhà máy
                  </p>
                </div>
              </div>
              
              {/* Feature indicators */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <Cog className="w-4 h-4" />
                  <span>Process Definition</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <FileText className="w-4 h-4" />
                  <span>Documentation</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Performance Tracking</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="lg:text-right">
              <Button
                onClick={handleCreateProcess}
                disabled={isCreating}
                className="bg-white text-slate-700 hover:bg-slate-50 border-0 shadow-lg text-lg px-8 py-4 h-auto font-semibold transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t('process.createNew', { default: 'Create Process' })}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="container mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* Main Content */}
        <div
          data-testid="processs-content"
          className="space-y-6"
        >
          {/* Responsive Layout Indicators */}
          {isMobile
            ? (
                <div data-testid="processs-mobile-layout" className="sr-only">
                  Mobile Layout
                </div>
              )
            : (
                <div data-testid="processs-desktop-layout" className="sr-only">
                  Desktop Layout
                </div>
              )}

          <ProcessList
            key={refreshKey}
            onEdit={handleEditProcess}
            onDelete={handleDeleteSuccess}
          />
        </div>
      </div>

      {/* Modal */}
      <ProcessModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </main>
  );
}
