'use client';

/**
 * ProductionProgressReportSkeleton Component
 * Loading skeleton for production progress report
 * Following Yamato-SaaS patterns with consistent design
 */

import React from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type ProductionProgressReportSkeletonProps = {
  className?: string;
};

export function ProductionProgressReportSkeleton({
  className = '',
}: ProductionProgressReportSkeletonProps): JSX.Element {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Table Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 pb-4 border-b">
            <Skeleton className="h-4 w-full col-span-1" />
            <Skeleton className="h-4 w-full col-span-2" />
            <Skeleton className="h-4 w-full col-span-1" />
            <Skeleton className="h-4 w-full col-span-1" />
            <Skeleton className="h-4 w-full col-span-1" />
            <Skeleton className="h-4 w-full col-span-1" />
            <Skeleton className="h-4 w-full col-span-1" />
            <Skeleton className="h-4 w-full col-span-1" />
            <Skeleton className="h-4 w-full col-span-1" />
            <Skeleton className="h-4 w-full col-span-1" />
            <Skeleton className="h-4 w-full col-span-1" />
          </div>

          {/* Table Rows */}
          <div className="space-y-4 pt-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 py-2">
                <Skeleton className="h-6 w-16 col-span-1" />
                <Skeleton className="h-4 w-full col-span-2" />
                <Skeleton className="h-4 w-full col-span-1" />
                <Skeleton className="h-4 w-full col-span-1" />
                <Skeleton className="h-4 w-full col-span-1" />
                <Skeleton className="h-4 w-12 col-span-1 ml-auto" />
                <Skeleton className="h-4 w-12 col-span-1 ml-auto" />
                <Skeleton className="h-4 w-12 col-span-1 ml-auto" />
                <Skeleton className="h-4 w-12 col-span-1 ml-auto" />
                <Skeleton className="h-4 w-12 col-span-1 ml-auto" />
                <Skeleton className="h-6 w-16 col-span-1 ml-auto" />
              </div>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}