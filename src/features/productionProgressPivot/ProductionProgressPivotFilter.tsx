'use client';

/**
 * ProductionProgressPivotFilter Component
 * Filter controls for production progress pivot report
 * Following Yamato-SaaS patterns with responsive design
 */

import { ChevronDown, Filter, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductionProgressPivotFilterOptions } from '@/hooks/useProductionProgressPivotFilterOptions';
import { useProductionProgressPivotFilters } from '@/hooks/useProductionProgressPivotFilters';
import type { ProductionProgressPivotItem } from '@/types/productionProgressPivot';

type ProductionProgressPivotFilterProps = {
  className?: string;
};

export function ProductionProgressPivotFilter({
  className = '',
}: ProductionProgressPivotFilterProps): JSX.Element {
  const t = useTranslations('productionProgressPivot.filter');
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: '',
    product_code: '__all__',
    plan_code: '__all__',
    sortBy: 'product_code' as keyof ProductionProgressPivotItem,
    sortOrder: 'asc' as 'asc' | 'desc',
  });

  const {
    filters,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useProductionProgressPivotFilters();

  const {
    data: options,
    isLoading: isLoadingOptions,
  } = useProductionProgressPivotFilterOptions();

  // Initialize local filters from current applied filters
  React.useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      ...filters,
      product_code: filters.product_code || '__all__',
      plan_code: filters.plan_code || '__all__',
    }));
  }, [filters]);

  const handleApplyFilters = useCallback(() => {
    const newFilters = {
      search: localFilters.search.trim(),
      product_code: localFilters.product_code === '__all__' ? '' : localFilters.product_code,
      plan_code: localFilters.plan_code === '__all__' ? '' : localFilters.plan_code,
      sortBy: localFilters.sortBy,
      sortOrder: localFilters.sortOrder,
    };
    applyFilters(newFilters);
    setIsExpanded(false);
  }, [localFilters, applyFilters]);

  const handleResetFilters = useCallback(() => {
    const resetState = {
      search: '',
      product_code: '__all__',
      plan_code: '__all__',
      sortBy: 'product_code' as const,
      sortOrder: 'asc' as const,
    };
    setLocalFilters(resetState);
    resetFilters();
    setIsExpanded(false);
  }, [resetFilters]);

  const handleLocalFilterChange = useCallback((key: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Auto-apply search filter with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localFilters.search !== filters.search) {
        handleApplyFilters();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [localFilters.search, filters.search, handleApplyFilters]);

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">
            {t('title', { defaultValue: 'Bộ lọc' })}
          </h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
              {t('clear', { defaultValue: 'Xóa' })}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-8 px-2"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t('search.placeholder', { defaultValue: 'Tìm kiếm sản phẩm, kế hoạch...' })}
            value={localFilters.search}
            onChange={(e) => handleLocalFilterChange('search', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyFilters();
              }
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Product Filter */}
            <div className="space-y-2">
              <Label htmlFor="product-filter">
                {t('product.label', { defaultValue: 'Sản phẩm' })}
              </Label>
              <Select
                value={localFilters.product_code}
                onValueChange={(value) => handleLocalFilterChange('product_code', value)}
                disabled={isLoadingOptions}
              >
                <SelectTrigger id="product-filter">
                  <SelectValue placeholder={t('product.placeholder', { defaultValue: 'Chọn sản phẩm...' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t('product.all', { defaultValue: 'Tất cả sản phẩm' })}</SelectItem>
                  {options?.products.map((product) => (
                    <SelectItem key={product.code} value={product.code}>
                      {product.name} ({product.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plan Filter */}
            <div className="space-y-2">
              <Label htmlFor="plan-filter">
                {t('plan.label', { defaultValue: 'Kế hoạch' })}
              </Label>
              <Select
                value={localFilters.plan_code}
                onValueChange={(value) => handleLocalFilterChange('plan_code', value)}
                disabled={isLoadingOptions}
              >
                <SelectTrigger id="plan-filter">
                  <SelectValue placeholder={t('plan.placeholder', { defaultValue: 'Chọn kế hoạch...' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t('plan.all', { defaultValue: 'Tất cả kế hoạch' })}</SelectItem>
                  {options?.plans.map((plan) => (
                    <SelectItem key={plan.code} value={plan.code}>
                      {plan.name} ({plan.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By Filter */}
            <div className="space-y-2">
              <Label htmlFor="sort-filter">
                {t('sortBy.label', { defaultValue: 'Sắp xếp theo' })}
              </Label>
              <Select
                value={localFilters.sortBy}
                onValueChange={(value) => handleLocalFilterChange('sortBy', value)}
              >
                <SelectTrigger id="sort-filter">
                  <SelectValue placeholder={t('sortBy.placeholder', { defaultValue: 'Chọn trường...' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_code">{t('sortBy.productCode', { defaultValue: 'Mã sản phẩm' })}</SelectItem>
                  <SelectItem value="product_name">{t('sortBy.productName', { defaultValue: 'Tên sản phẩm' })}</SelectItem>
                  <SelectItem value="plan_code">{t('sortBy.planCode', { defaultValue: 'Mã kế hoạch' })}</SelectItem>
                  <SelectItem value="planned_quantity">{t('sortBy.plannedQuantity', { defaultValue: 'SL kế hoạch' })}</SelectItem>
                  <SelectItem value="total_completed">{t('sortBy.totalCompleted', { defaultValue: 'Tổng hoàn thành' })}</SelectItem>
                  <SelectItem value="completion_rate">{t('sortBy.completionRate', { defaultValue: 'Tỷ lệ hoàn thành' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order Filter */}
            <div className="space-y-2">
              <Label htmlFor="sort-order-filter">
                {t('sortOrder.label', { defaultValue: 'Thứ tự' })}
              </Label>
              <Select
                value={localFilters.sortOrder}
                onValueChange={(value) => handleLocalFilterChange('sortOrder', value)}
              >
                <SelectTrigger id="sort-order-filter">
                  <SelectValue placeholder={t('sortOrder.placeholder', { defaultValue: 'Chọn thứ tự...' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{t('sortOrder.asc', { defaultValue: 'Tăng dần' })}</SelectItem>
                  <SelectItem value="desc">{t('sortOrder.desc', { defaultValue: 'Giảm dần' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
            >
              {t('reset', { defaultValue: 'Đặt lại' })}
            </Button>
            <Button
              size="sm"
              onClick={handleApplyFilters}
            >
              {t('apply', { defaultValue: 'Áp dụng' })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}