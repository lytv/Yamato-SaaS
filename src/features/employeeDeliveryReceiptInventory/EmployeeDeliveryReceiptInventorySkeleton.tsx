/**
 * EmployeeDeliveryReceiptInventorySkeleton Component
 * Following TDD Workflow Standards - Green Phase
 * Provides loading skeleton for employee delivery receipt inventory list
 */

import React from 'react';

type EmployeeDeliveryReceiptInventorySkeletonProps = {
  rows?: number;
  className?: string;
  variant?: 'desktop' | 'mobile';
  showSummary?: boolean;
  showFilter?: boolean;
};

export function EmployeeDeliveryReceiptInventorySkeleton({
  rows = 5,
  className = '',
  variant = 'desktop',
  showSummary = true,
  showFilter = true,
}: EmployeeDeliveryReceiptInventorySkeletonProps): JSX.Element {
  const skeletonRows = Array.from({ length: rows }, (_, index) => index);

  if (variant === 'mobile') {
    return (
      <div
        data-testid="mobile-skeleton"
        className={`space-y-4 ${className}`}
        role="status"
        aria-label="Loading employee delivery receipt inventory"
      >
        <span className="sr-only">Loading...</span>

        {/* Filter Skeleton */}
        {showFilter && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-full max-w-md animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-20 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        )}

        {/* Summary Cards Skeleton */}
        {showSummary && (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200 mb-2" />
                <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        )}

        {/* Mobile Cards Skeleton */}
        {skeletonRows.map(row => (
          <div
            key={row}
            data-testid="skeleton-row"
            className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="flex justify-between pt-2">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-14 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      data-testid="employee-delivery-receipt-inventory-skeleton"
      className={`space-y-6 ${className}`}
      role="status"
      aria-label="Loading employee delivery receipt inventory"
    >
      <span className="sr-only">Loading...</span>

      {/* Filter Skeleton */}
      {showFilter && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="h-10 w-full max-w-md animate-pulse rounded bg-gray-200" />
              <div className="flex items-center space-x-2">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-9 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards Skeleton */}
      {showSummary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center">
                <div className="h-8 w-8 animate-pulse rounded bg-gray-200 mr-3" />
                <div className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Skeleton */}
      <div data-testid="desktop-skeleton" className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Table Header Skeleton */}
        <div
          data-testid="skeleton-header"
          className="grid grid-cols-8 gap-4 border-b border-gray-200 bg-gray-50 p-4"
        >
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Table Rows Skeleton */}
        {skeletonRows.map(row => (
          <div
            key={row}
            data-testid="skeleton-row"
            className="grid grid-cols-8 gap-4 border-b border-gray-200 p-4 hover:bg-gray-50"
          >
            {/* Employee Name */}
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            
            {/* Plan Code */}
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            
            {/* Product */}
            <div className="space-y-1">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
            </div>
            
            {/* Step */}
            <div className="space-y-1">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            </div>
            
            {/* Assigned */}
            <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
            
            {/* Received */}
            <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
            
            {/* Inventory */}
            <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
            
            {/* Completion Rate */}
            <div className="flex items-center space-x-2">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-2 w-20 animate-pulse rounded-full bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}