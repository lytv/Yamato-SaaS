'use client';

/**
 * EmployeeDeliveryReceiptInventoryList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays employee delivery receipt inventory in table format with sorting and pagination
 */

import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useState } from 'react';

import { useEmployeeDeliveryReceiptInventory } from '@/hooks/useEmployeeDeliveryReceiptInventory';
import { useEmployeeDeliveryReceiptInventoryExport } from '@/hooks/useEmployeeDeliveryReceiptInventoryExport';
import { useEmployeeDeliveryReceiptInventoryFilters } from '@/hooks/useEmployeeDeliveryReceiptInventoryFilters';

import { EmployeeDeliveryReceiptInventoryFilter } from './EmployeeDeliveryReceiptInventoryFilter';
import { EmployeeDeliveryReceiptInventorySkeleton } from './EmployeeDeliveryReceiptInventorySkeleton';

type EmployeeDeliveryReceiptInventoryListProps = {
  className?: string;
};

export function EmployeeDeliveryReceiptInventoryList({
  className = '',
}: EmployeeDeliveryReceiptInventoryListProps): JSX.Element {
  const t = useTranslations('employeeDeliveryReceiptInventory.list');
  const [currentPage, setCurrentPage] = useState(1);

  const { filters, getApiFilters } = useEmployeeDeliveryReceiptInventoryFilters();
  const { exportData, isExporting, exportError } = useEmployeeDeliveryReceiptInventoryExport();

  const apiFilters = React.useMemo(() => getApiFilters(), [getApiFilters]);
  const { data, summary, pagination, isLoading, error, refetch } = useEmployeeDeliveryReceiptInventory({
    ...apiFilters,
    page: currentPage,
  });

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Reset page when filters change and force data refetch
  React.useEffect(() => {
    setCurrentPage(1);
    // Force refetch when filters change to ensure data is reloaded
    const timeoutId = setTimeout(() => {
      refetch();
    }, 100); // Small delay to ensure state is updated

    return () => clearTimeout(timeoutId);
  }, [filters, refetch]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      await exportData({
        ...apiFilters,
        format: 'xlsx',
        includeHeaders: true,
      });
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [exportData, apiFilters]);

  // Format number with thousand separators
  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  }, []);

  // Format percentage
  const formatPercentage = useCallback((rate: number): string => {
    return `${rate.toFixed(2)}%`;
  }, []);

  // Get completion rate color
  const getCompletionRateColor = useCallback((rate: number): string => {
    if (rate >= 100) {
      return 'text-green-600 bg-green-50';
    }
    if (rate >= 80) {
      return 'text-green-600 bg-green-50';
    }
    if (rate >= 50) {
      return 'text-yellow-600 bg-yellow-50';
    }
    return 'text-red-600 bg-red-50';
  }, []);

  // Get completion rate progress width
  const getProgressWidth = useCallback((rate: number): string => {
    return `${Math.min(rate, 100)}%`;
  }, []);

  // Loading state
  if (isLoading && data.length === 0) {
    return (
      <div className={className}>
        <EmployeeDeliveryReceiptInventorySkeleton />
      </div>
    );
  }

  // Error state
  if (error && data.length === 0) {
    return (
      <div className={`${className} py-12 text-center`}>
        <div className="mb-4 text-red-600">
          <p className="text-lg font-medium">{t('error_title')}</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  // Empty state
  if (data.length === 0 && !isLoading) {
    return (
      <div className={className}>
        <EmployeeDeliveryReceiptInventoryFilter />
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">{t('no_data')}</p>
          <p className="mt-2 text-sm text-gray-400">{t('no_data_description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filter Component */}
      <EmployeeDeliveryReceiptInventoryFilter />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100">
                  <span className="text-sm font-medium text-blue-600">👥</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">{t('total_employees')}</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(summary.total_employees)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-green-100">
                  <span className="text-sm font-medium text-green-600">📦</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">{t('total_assigned')}</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(summary.total_assigned)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100">
                  <span className="text-sm font-medium text-purple-600">✅</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">{t('total_received')}</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(summary.total_received)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100">
                  <span className="text-sm font-medium text-orange-600">📊</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">{t('avg_completion_rate')}</p>
                <p className="text-2xl font-semibold text-gray-900">{formatPercentage(summary.average_completion_rate)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="mr-2 size-4" />
          {isExporting ? t('exporting') : t('export')}
        </button>
      </div>

      {exportError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            {t('export_error')}
            :
            {exportError.message}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('employee')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('plan')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('product')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('step')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('assigned')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('received')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('inventory')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('completion_rate')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.map(item => (
                <tr key={`${item.employee_id}-${item.plan_code}-${item.product_code}-${item.step_code}`} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.employee_name}</div>
                    <div className="text-sm text-gray-500">{item.employee_id}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{item.plan_code}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.product_code}</div>
                    <div className="text-sm text-gray-500">{item.product_name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.step_code}</div>
                    <div className="text-sm text-gray-500">{item.step_name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    {formatNumber(item.total_assigned)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    {formatNumber(item.total_received)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    <span className={item.current_inventory < 0 ? 'text-red-600' : ''}>
                      {formatNumber(item.current_inventory)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCompletionRateColor(item.completion_rate)}`}>
                        {formatPercentage(item.completion_rate)}
                      </span>
                      <div className="h-2 w-16 rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${item.completion_rate >= 100 ? 'bg-green-500' : item.completion_rate >= 80 ? 'bg-green-400' : item.completion_rate >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: getProgressWidth(item.completion_rate) }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total > pagination.limit && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('previous')}
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasMore}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('next')}
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('showing')}
                  {' '}
                  <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span>
                  {' '}
                  {t('to')}
                  {' '}
                  <span className="font-medium">{Math.min(currentPage * pagination.limit, pagination.total)}</span>
                  {' '}
                  {t('of')}
                  {' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}
                  {t('results')}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="size-5" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.limit)) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        type="button"
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 border-indigo-500 bg-indigo-50 text-indigo-600'
                            : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasMore}
                    className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay for subsequent loads */}
      {isLoading && data.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25">
          <div className="rounded-lg bg-white p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="size-6 animate-spin rounded-full border-b-2 border-indigo-600"></div>
              <span className="text-sm text-gray-700">{t('loading')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
