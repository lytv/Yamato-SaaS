/**
 * NoteSkeleton Component
 * Loading skeleton for note items following Shadcn UI patterns
 * Used to provide visual feedback during data loading
 */

export function NoteSkeleton(): JSX.Element {
  return (
    <div data-testid="note-skeleton" className="w-full rounded-lg border bg-card p-4">
      <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mb-4 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
      <div className="mb-2 h-20 w-full animate-pulse rounded bg-gray-200" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-8 w-12 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-12 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

/**
 * NoteListSkeleton Component
 * Multiple note item skeletons for list loading state
 */
type NoteListSkeletonProps = {
  count?: number;
};

export function NoteListSkeleton({ count = 5 }: NoteListSkeletonProps): JSX.Element {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <NoteSkeleton key={index} />
      ))}
    </div>
  );
}
