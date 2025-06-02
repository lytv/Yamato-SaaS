/**
 * Todos Page
 * Main todo management page integrating TodoList and TodoForm components
 * Following TDD implementation and Yamato-SaaS patterns
 */

'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { TodoForm } from '@/features/todo/TodoForm';
import { TodoList } from '@/features/todo/TodoList';
import type { Todo } from '@/types/todo';

type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  todo?: Todo;
};

/**
 * Modal component for create/edit forms
 */
function TodoModal({
  modal,
  onClose,
  onSuccess,
}: {
  modal: ModalState;
  onClose: () => void;
  onSuccess: () => void;
}) {
  if (!modal.isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {modal.mode === 'create' ? 'Create Todo' : 'Edit Todo'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>

        <TodoForm
          mode={modal.mode}
          todo={modal.todo}
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
        />
      </div>
    </div>
  );
}

/**
 * Main Todos page component
 */
export default function TodosPage(): JSX.Element {
  const t = useTranslations();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateTodo = () => {
    setModal({
      isOpen: true,
      mode: 'create',
    });
  };

  const handleEditTodo = (todo: Todo) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      todo,
    });
  };

  const handleCloseModal = () => {
    setModal({
      isOpen: false,
      mode: 'create',
    });
  };

  const handleSuccess = () => {
    // Trigger a refresh of the todo list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('todo.pageTitle', { default: 'Todos' })}
          </h1>
          <p className="text-muted-foreground">
            {t('todo.pageDescription', {
              default: 'Manage your todos and stay organized',
            })}
          </p>
        </div>

        <Button onClick={handleCreateTodo}>
          {t('todo.createNew', { default: 'Create Todo' })}
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <TodoList
          key={refreshKey}
          onEdit={handleEditTodo}
          onDelete={handleSuccess} // Refresh after delete
        />
      </div>

      {/* Modal */}
      <TodoModal
        modal={modal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
