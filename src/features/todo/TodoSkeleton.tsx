/**
 * TodoSkeleton Component
 * Loading skeleton for todo items following Shadcn UI patterns
 * Used to provide visual feedback during data loading
 */

export function TodoSkeleton(): JSX.Element {
  return (
    <div data-testid="todo-skeleton" className="w-full rounded-lg border bg-card p-4">
      <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mb-4 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
      <div className="mb-2 h-4 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

/**
 * TodoListSkeleton Component
 * Multiple todo item skeletons for list loading state
 */
type TodoListSkeletonProps = {
  count?: number;
};

export function TodoListSkeleton({ count = 5 }: TodoListSkeletonProps): JSX.Element {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <TodoSkeleton key={index} />
      ))}
    </div>
  );
}
