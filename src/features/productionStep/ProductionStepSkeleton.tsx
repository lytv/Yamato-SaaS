/**
 * ProductionStepSkeleton Component
 * Following TDD Workflow Standards - Green Phase
 * Loading skeleton for production steps list
 */

import React from 'react';

type ProductionStepSkeletonProps = {
  'data-testid'?: string;
};

export function ProductionStepSkeleton(props: ProductionStepSkeletonProps): JSX.Element {
  return (
    <div {...props} className="space-y-6">
      {/* Search and Filter Controls Skeleton */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="max-w-lg flex-1">
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200" />
          <div className="size-10 animate-pulse rounded-md bg-gray-200" />
        </div>
      </div>

      {/* Count Skeleton */}
      <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />

      {/* Table Skeleton */}
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <td key={colIndex} className="whitespace-nowrap px-6 py-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
