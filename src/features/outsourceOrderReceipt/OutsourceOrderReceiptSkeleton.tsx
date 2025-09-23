/**
 * OutsourceOrderReceipt Skeleton Loading Component
 * Generated based on existing pattern from OutsourceOrderDetailSkeleton.tsx
 */

import { Skeleton } from '@/components/ui/skeleton';

export function OutsourceOrderReceiptSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header actions skeleton */}
      <div className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-64" />
          {' '}
          {/* Search input */}
          <Skeleton className="h-10 w-32" />
          {' '}
          {/* Filter dropdown */}
          <Skeleton className="h-10 w-32" />
          {' '}
          {/* Status filter */}
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          {' '}
          {/* Export button */}
          <Skeleton className="h-10 w-32" />
          {' '}
          {/* Add receipt button */}
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <Skeleton className="size-8 rounded-full" />
              <div className="ml-4 space-y-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="p-6">
          {/* Table header */}
          <div className="flex space-x-4 border-b pb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Table rows */}
          <div className="space-y-4 pt-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
                <div className="flex space-x-2">
                  <Skeleton className="size-8" />
                  <Skeleton className="size-8" />
                  <Skeleton className="size-8" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <Skeleton className="h-4 w-48" />
            <div className="flex space-x-2">
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
