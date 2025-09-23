/**
 * Price Summary Skeleton Component
 * Loading state for price summary pivot table
 * Following Yamato-SaaS patterns with responsive design
 */

'use client';

import React from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type PriceSummarySkeletonProps = {
  className?: string;
  rows?: number;
  showSummaryCards?: boolean;
};

export function PriceSummarySkeleton({
  className = '',
  rows = 5,
  showSummaryCards = true,
}: PriceSummarySkeletonProps): JSX.Element {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Cards Skeleton */}
      {showSummaryCards && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-200 p-2">
                    <Skeleton className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table Skeleton */}
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <Skeleton className="size-6" />
              </div>
              <div>
                <Skeleton className="mb-2 h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Skeleton className="h-4 w-24" />
                  </th>
                  <th className="px-6 py-3 text-center">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  {/* Dynamic step columns skeleton */}
                  {Array.from({ length: 6 }).map((_, index) => (
                    <th key={index} className="px-4 py-3 text-center">
                      <Skeleton className="h-4 w-16" />
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="px-6 py-3 text-right">
                    <Skeleton className="h-4 w-24" />
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-200 bg-white">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {/* Product Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-4 shrink-0" />
                        <div className="min-w-0">
                          <Skeleton className="mb-1 h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </td>

                    {/* Plan Code */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Skeleton className="size-4" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </td>

                    {/* Dynamic Step Columns */}
                    {Array.from({ length: 6 }).map((_, colIndex) => (
                      <td key={colIndex} className="p-4 text-center">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <Skeleton className="size-3" />
                            <Skeleton className="h-5 w-12 rounded-full" />
                          </div>
                          <Skeleton className="h-1 w-full rounded-full" />
                        </div>
                      </td>
                    ))}

                    {/* Total Steps */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="size-4" />
                        <Skeleton className="h-5 w-8 rounded-full" />
                      </div>
                    </td>

                    {/* Total Price */}
                    <td className="px-6 py-4 text-right">
                      <div className="space-y-1">
                        <div className="flex items-center justify-end gap-2">
                          <Skeleton className="size-4" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-1 w-full rounded-full" />
                        <Skeleton className="ml-auto h-3 w-8" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact skeleton for small spaces
 */
export function PriceSummaryCompactSkeleton({
  className = '',
  rows = 3,
}: {
  className?: string;
  rows?: number;
}): JSX.Element {
  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-3" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
