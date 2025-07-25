/**
 * Price Summary Dashboard Page
 * Following Yamato-SaaS patterns with integrated filter and list components
 * Main page for viewing price summary pivot table
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

import { PriceSummaryFilter } from '@/features/priceSummary/PriceSummaryFilter';
import { PriceSummaryList } from '@/features/priceSummary/PriceSummaryList';
import { usePriceSummary } from '@/hooks/usePriceSummary';
import { usePriceSummaryFilters } from '@/hooks/usePriceSummaryFilters';

/**
 * Main dashboard page component
 */
export default function PriceSummaryPage(): JSX.Element {
  const { userId: _userId, orgId: _orgId } = useAuth();
  const t = useTranslations('priceSummary.page');
  const [page, setPage] = useState(1);

  // Filter management
  const {
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  } = usePriceSummaryFilters();

  // Data fetching with current filters and pagination
  const {
    data,
    summary,
    pagination,
    isLoading,
    isError,
    error,
    refetch,
  } = usePriceSummary({
    ...filters,
    page,
    limit: 20,
  });

  // Handle filter changes (reset to page 1)
  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  // Handle filter reset
  const handleFilterReset = () => {
    resetFilters();
    setPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              {t('title', { defaultValue: 'Tổng Hợp Đơn Giá' })}
            </h1>
            <p className="mt-2 max-w-4xl text-sm text-gray-500">
              {t('description', { 
                defaultValue: 'Báo cáo tổng hợp đơn giá theo công đoạn với khả năng pivot động và xuất dữ liệu' 
              })}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 sm:ml-4 sm:mt-0">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <span className="font-medium">Loại giá hiện tại:</span>
              <span className="font-semibold text-blue-600">
                {filters.price_type === 'factory_price' && 'Đơn giá xưởng'}
                {filters.price_type === 'calculated_price' && 'Đơn giá về tính'}
                {filters.price_type === 'retail_price' && 'Đơn giá bán lẻ'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <PriceSummaryFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleFilterReset}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <div className="space-y-6">
        <PriceSummaryList
          data={data}
          summary={summary}
          pagination={pagination}
          filters={filters}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRefetch={refetch}
        />

        {/* Pagination */}
        {!isLoading && !isError && pagination.total > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                Hiển thị {((page - 1) * 20) + 1} - {Math.min(page * 20, pagination.total)} trong tổng số {pagination.total} sản phẩm
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, Math.ceil(pagination.total / 20)) }, (_, i) => {
                const pageNum = Math.max(1, page - 2) + i;
                const totalPages = Math.ceil(pagination.total / 20);
                
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      pageNum === page
                        ? 'text-white bg-blue-600 border border-blue-600'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!pagination.hasMore}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-gray-200 pt-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>
              📊 Dữ liệu từ stored procedure: <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">sp_product_price_pivot</code>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Cập nhật: {new Date().toLocaleString('vi-VN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}