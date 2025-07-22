'use client';

/**
 * ProductionProgressReportFilter Component
 * Filter controls for production progress report
 * Following Yamato-SaaS patterns with responsive design
 */

import { ChevronDown, Filter, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductionProgressReportFilterOptions } from '@/hooks/useProductionProgressReportFilterOptions';
import { useProductionProgressReportFilters } from '@/hooks/useProductionProgressReportFilters';
import type { ProductionProgressReportItem } from '@/types/productionProgressReport';

type ProductionProgressReportFilterProps = {
  className?: string;
};

export function ProductionProgressReportFilter({
  className = '',
}: ProductionProgressReportFilterProps): JSX.Element {
  const t = useTranslations('productionProgressReport.filter');
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: '',
    plan_code: '__all__',
    product_code: '__all__',
    production_step_code: '__all__',
    report_type: 'ALL' as 'ALL' | 'EMPLOYEE_SUMMARY' | 'OUTSOURCE_DETAIL',
    sortBy: 'plan_code' as keyof ProductionProgressReportItem,
    sortOrder: 'asc' as 'asc' | 'desc',
  });

  const {
    filters,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useProductionProgressReportFilters();

  const {
    data: options,
    isLoading: isLoadingOptions,
  } = useProductionProgressReportFilterOptions();

  // Initialize local filters from current applied filters
  React.useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      ...filters,
      plan_code: filters.plan_code || '__all__',
      product_code: filters.product_code || '__all__',
      production_step_code: filters.production_step_code || '__all__',
    }));
  }, [filters]);

  const handleApplyFilters = useCallback(() => {
    applyFilters({
      search: localFilters.search.trim(),
      plan_code: localFilters.plan_code === '__all__' ? '' : localFilters.plan_code,
      product_code: localFilters.product_code === '__all__' ? '' : localFilters.product_code,
      production_step_code: localFilters.production_step_code === '__all__' ? '' : localFilters.production_step_code,
      report_type: localFilters.report_type,
      sortBy: localFilters.sortBy,
      sortOrder: localFilters.sortOrder,
    });
    setIsExpanded(false);
  }, [localFilters, applyFilters]);

  const handleResetFilters = useCallback(() => {
    const resetState = {
      search: '',
      plan_code: '__all__',
      product_code: '__all__',
      production_step_code: '__all__',
      report_type: 'ALL' as const,
      sortBy: 'plan_code' as const,
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

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">
            {t('title', { defaultValue: 'Filters' })}
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
              {t('clear', { defaultValue: 'Clear' })}
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
            placeholder={t('search.placeholder', { defaultValue: 'Search entities, plans, products...' })}
            value={localFilters.search}
            onChange={(e) => handleLocalFilterChange('search', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
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
            {/* Plan Filter */}
            <div className="space-y-2">
              <Label htmlFor="plan-filter">
                {t('plan.label', { defaultValue: 'Plan' })}
              </Label>
              <Select
                value={localFilters.plan_code}
                onValueChange={(value) => handleLocalFilterChange('plan_code', value)}
                disabled={isLoadingOptions}
              >
                <SelectTrigger id="plan-filter">
                  <SelectValue placeholder={t('plan.placeholder', { defaultValue: 'Select plan...' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t('plan.all', { defaultValue: 'All Plans' })}</SelectItem>
                  {options?.plans.map((plan) => (
                    <SelectItem key={plan.code} value={plan.code}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Filter */}
            <div className="space-y-2">
              <Label htmlFor="product-filter">
                {t('product.label', { defaultValue: 'Product' })}
              </Label>
              <Select
                value={localFilters.product_code}
                onValueChange={(value) => handleLocalFilterChange('product_code', value)}
                disabled={isLoadingOptions}
              >
                <SelectTrigger id="product-filter">
                  <SelectValue placeholder={t('product.placeholder', { defaultValue: 'Select product...' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t('product.all', { defaultValue: 'All Products' })}</SelectItem>
                  {options?.products.map((product) => (
                    <SelectItem key={product.code} value={product.code}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Production Step Filter */}
            <div className="space-y-2">
              <Label htmlFor="step-filter">
                {t('step.label', { defaultValue: 'Production Step' })}
              </Label>
              <Select
                value={localFilters.production_step_code}
                onValueChange={(value) => handleLocalFilterChange('production_step_code', value)}
                disabled={isLoadingOptions}
              >
                <SelectTrigger id="step-filter">
                  <SelectValue placeholder={t('step.placeholder', { defaultValue: 'Select step...' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t('step.all', { defaultValue: 'All Steps' })}</SelectItem>
                  {options?.productionSteps.map((step) => (
                    <SelectItem key={step.code} value={step.code}>
                      {step.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Report Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="report-type-filter">
                {t('reportType.label', { defaultValue: 'Report Type' })}
              </Label>
              <Select
                value={localFilters.report_type}
                onValueChange={(value) => handleLocalFilterChange('report_type', value)}
              >
                <SelectTrigger id="report-type-filter">
                  <SelectValue placeholder={t('reportType.placeholder', { defaultValue: 'Select type...' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('reportType.all', { defaultValue: 'All Reports' })}</SelectItem>
                  <SelectItem value="EMPLOYEE_SUMMARY">{t('reportType.employee', { defaultValue: 'Employee Summary' })}</SelectItem>
                  <SelectItem value="OUTSOURCE_DETAIL">{t('reportType.outsource', { defaultValue: 'Outsource Detail' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By Filter */}
            <div className="space-y-2">
              <Label htmlFor="sort-filter">
                {t('sortBy.label', { defaultValue: 'Sort By' })}
              </Label>
              <Select
                value={localFilters.sortBy}
                onValueChange={(value) => handleLocalFilterChange('sortBy', value)}
              >
                <SelectTrigger id="sort-filter">
                  <SelectValue placeholder={t('sortBy.placeholder', { defaultValue: 'Select field...' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan_code">{t('sortBy.planCode', { defaultValue: 'Plan Code' })}</SelectItem>
                  <SelectItem value="product_code">{t('sortBy.productCode', { defaultValue: 'Product Code' })}</SelectItem>
                  <SelectItem value="entity_name">{t('sortBy.entityName', { defaultValue: 'Entity Name' })}</SelectItem>
                  <SelectItem value="completion_rate">{t('sortBy.completionRate', { defaultValue: 'Completion Rate' })}</SelectItem>
                  <SelectItem value="total_made">{t('sortBy.totalMade', { defaultValue: 'Total Made' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order Filter */}
            <div className="space-y-2">
              <Label htmlFor="sort-order-filter">
                {t('sortOrder.label', { defaultValue: 'Sort Order' })}
              </Label>
              <Select
                value={localFilters.sortOrder}
                onValueChange={(value) => handleLocalFilterChange('sortOrder', value)}
              >
                <SelectTrigger id="sort-order-filter">
                  <SelectValue placeholder={t('sortOrder.placeholder', { defaultValue: 'Select order...' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{t('sortOrder.asc', { defaultValue: 'Ascending' })}</SelectItem>
                  <SelectItem value="desc">{t('sortOrder.desc', { defaultValue: 'Descending' })}</SelectItem>
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
              {t('reset', { defaultValue: 'Reset' })}
            </Button>
            <Button
              size="sm"
              onClick={handleApplyFilters}
            >
              {t('apply', { defaultValue: 'Apply Filters' })}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}