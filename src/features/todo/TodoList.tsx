/**
 * TodoList Component
 * Displays a list of todos with search, filtering, and pagination
 * Following TDD implementation and Shadcn UI patterns
 */

'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTodoFilters } from '@/hooks/useTodoFilters';
import { useTodoMutations } from '@/hooks/useTodoMutations';
import { useTodos } from '@/hooks/useTodos';
import type { Todo } from '@/types/todo';

import { TodoListSkeleton } from './TodoSkeleton';

/**
 * Helper function to safely format date
 */
function formatDate(date: Date | string): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
}

/**
 * TodoItem component for individual todo display
 */
function TodoItem({
  todo,
  onEdit,
  onDelete,
}: {
  todo: Todo;
  onEdit?: (todo: Todo) => void;
  onDelete?: (id: number) => void;
}) {
  return (
    <li className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">{todo.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{todo.message}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatDate(todo.createdAt)}
        </span>
        {(onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(todo)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(todo.id)}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  const t = useTranslations();

  return (
    <div className="py-8 text-center">
      <p className="text-muted-foreground">{t('todo.noTodos')}</p>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({ error }: { error: string }) {
  const t = useTranslations();

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-red-600">{t('error.fetchTodos')}</p>
      <p className="mt-1 text-sm text-red-500">{error}</p>
    </div>
  );
}

/**
 * Pagination component
 */
function Pagination({ pagination }: { pagination: { page: number; limit: number; total: number; hasMore: boolean } }) {
  const t = useTranslations();

  if (pagination.total <= pagination.limit) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-center">
      <span className="text-sm text-muted-foreground">
        {t('pagination.page')}
        {' '}
        {pagination.page}
      </span>
    </div>
  );
}

/**
 * Main TodoList component
 */
export function TodoList({
  onEdit,
  onDelete,
}: {
  onEdit?: (todo: Todo) => void;
  onDelete?: (id: number) => void;
} = {}): JSX.Element {
  const t = useTranslations();
  const { deleteTodo } = useTodoMutations();
  const {
    search,
    sortBy,
    sortOrder,
    handleSearchChange,
    handleSortChange,
    resetFilters,
  } = useTodoFilters();

  const { todos, pagination, isLoading, error, refresh } = useTodos({
    page: 1,
    limit: 10,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteTodo(id);
      refresh(); // Refresh the list after deletion
      if (onDelete) {
        onDelete(id);
      }
    } catch {
      // Error is handled by the hook
    }
  };

  if (isLoading) {
    return <TodoListSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          type="search"
          role="searchbox"
          placeholder={t('todo.searchPlaceholder')}
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="flex-1"
        />

        <select
          data-testid="sort-select"
          value={sortBy}
          onChange={e => handleSortChange(e.target.value as any)}
          className="rounded-md border bg-background px-3 py-2"
        >
          <option value="createdAt">{t('todo.sort.createdAt')}</option>
          <option value="updatedAt">{t('todo.sort.updatedAt')}</option>
          <option value="title">{t('todo.sort.title')}</option>
        </select>

        {(search || sortBy !== 'createdAt' || sortOrder !== 'desc') && (
          <Button variant="outline" onClick={resetFilters}>
            {t('todo.resetFilters')}
          </Button>
        )}
      </div>

      {/* Todo List */}
      {todos.length === 0
        ? (
            <EmptyState />
          )
        : (
            <>
              <ul className="space-y-4">
                {todos.map(todo => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>

              {pagination && <Pagination pagination={pagination} />}
            </>
          )}
    </div>
  );
}
