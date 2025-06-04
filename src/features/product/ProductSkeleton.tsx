/**
 * ProductSkeleton Component
 * Following TDD Workflow Standards - Green Phase
 * Provides loading skeleton for product list and forms
 */

import React from 'react';

type ProductSkeletonProps = {
  rows?: number;
  className?: string;
  variant?: 'desktop' | 'mobile';
};

export function ProductSkeleton({
  rows = 3,
  className = '',
  variant = 'desktop',
}: ProductSkeletonProps): JSX.Element {
  const skeletonRows = Array.from({ length: rows }, (_, index) => index);

  if (variant === 'mobile') {
    return (
      <div
        data-testid="mobile-skeleton"
        className={`space-y-4 ${className}`}
        role="status"
        aria-label="Loading products"
      >
        <span className="sr-only">Loading...</span>
        {skeletonRows.map(row => (
          <div
            key={row}
            data-testid="skeleton-row"
            className="space-y-3 rounded-lg border p-4"
          >
            <div
              data-testid="skeleton-animate"
              className="h-4 w-3/4 animate-pulse rounded bg-gray-200"
            />
            <div
              data-testid="skeleton-animate"
              className="h-3 w-1/2 animate-pulse rounded bg-gray-200"
            />
            <div
              data-testid="skeleton-animate"
              className="h-3 w-2/3 animate-pulse rounded bg-gray-200"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="product-skeleton"
      className={`${className}`}
      role="status"
      aria-label="Loading products"
    >
      <span className="sr-only">Loading...</span>

      <div data-testid="desktop-skeleton">
        {/* Table Header Skeleton */}
        <div
          data-testid="skeleton-header"
          className="grid grid-cols-6 gap-4 border-b bg-gray-50 p-4"
        >
          <div
            data-testid="skeleton-animate"
            className="h-4 animate-pulse rounded bg-gray-200"
          />
          <div
            data-testid="skeleton-animate"
            className="h-4 animate-pulse rounded bg-gray-200"
          />
          <div
            data-testid="skeleton-animate"
            className="h-4 animate-pulse rounded bg-gray-200"
          />
          <div
            data-testid="skeleton-animate"
            className="h-4 animate-pulse rounded bg-gray-200"
          />
          <div
            data-testid="skeleton-animate"
            className="h-4 animate-pulse rounded bg-gray-200"
          />
          <div
            data-testid="skeleton-animate"
            className="h-4 w-20 animate-pulse rounded bg-gray-200"
          />
        </div>

        {/* Table Rows Skeleton */}
        {skeletonRows.map(row => (
          <div
            key={row}
            data-testid="skeleton-row"
            className="grid grid-cols-6 gap-4 border-b p-4 hover:bg-gray-50"
          >
            <div
              data-testid="skeleton-animate"
              className="h-4 w-24 animate-pulse rounded bg-gray-200"
            />
            <div
              data-testid="skeleton-animate"
              className="h-4 animate-pulse rounded bg-gray-200"
            />
            <div
              data-testid="skeleton-animate"
              className="h-4 w-20 animate-pulse rounded bg-gray-200"
            />
            <div
              data-testid="skeleton-animate"
              className="h-3 w-32 animate-pulse rounded bg-gray-200"
            />
            <div
              data-testid="skeleton-animate"
              className="h-3 w-16 animate-pulse rounded bg-gray-200"
            />
            <div className="flex space-x-2">
              <div
                data-testid="skeleton-animate"
                className="h-8 w-16 animate-pulse rounded bg-gray-200"
              />
              <div
                data-testid="skeleton-animate"
                className="h-8 w-16 animate-pulse rounded bg-gray-200"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
