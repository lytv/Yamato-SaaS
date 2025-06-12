/**
 * ProductionStepDetailSkeleton Component
 * Loading skeleton for production step detail components
 * Following existing skeleton patterns
 */

import React from 'react';

export function ProductionStepDetailSkeleton(): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="max-w-lg flex-1">
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200" />
          <div className="size-10 animate-pulse rounded-md bg-gray-200" />
          <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200" />
        </div>
      </div>

      {/* Count Info */}
      <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />

      {/* Table */}
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        <div className="divide-y divide-gray-200">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3">
            <div className="flex space-x-8">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            </div>
          </div>

          {/* Table Rows */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex space-x-8">
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="flex space-x-2">
                  <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Load More Button */}
      <div className="text-center">
        <div className="mx-auto h-10 w-24 animate-pulse rounded-md bg-gray-200" />
      </div>
    </div>
  );
}
