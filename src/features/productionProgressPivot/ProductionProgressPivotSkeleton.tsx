'use client';

/**
 * ProductionProgressPivotSkeleton Component
 * Loading skeleton for pivot table
 * Following Yamato-SaaS patterns
 */

import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';

export function ProductionProgressPivotSkeleton(): JSX.Element {
  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24" />
        {' '}
        {/* Product Code */}
        <Skeleton className="h-10 w-32" />
        {' '}
        {/* Product Name */}
        <Skeleton className="h-10 w-24" />
        {' '}
        {/* Plan Code */}
        <Skeleton className="h-10 w-24" />
        {' '}
        {/* Planned Qty */}
        <Skeleton className="h-10 w-20" />
        {' '}
        {/* Step 1 */}
        <Skeleton className="h-10 w-20" />
        {' '}
        {/* Step 2 */}
        <Skeleton className="h-10 w-20" />
        {' '}
        {/* Step 3 */}
        <Skeleton className="h-10 w-24" />
        {' '}
        {/* Total */}
        <Skeleton className="h-10 w-24" />
        {' '}
        {/* Rate */}
      </div>

      {/* Table Rows */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}
