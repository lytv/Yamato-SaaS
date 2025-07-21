'use client';

/**
 * EmployeeDeliveryReceiptInventoryFilter Component
 * Filter controls for employee delivery receipt inventory
 * Following Yamato-SaaS patterns with responsive design
 */

import { ChevronDown, Filter, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { useEmployeeDeliveryReceiptInventoryFilterOptions } from '@/hooks/useEmployeeDeliveryReceiptInventoryFilterOptions';
import { useEmployeeDeliveryReceiptInventoryFilters } from '@/hooks/useEmployeeDeliveryReceiptInventoryFilters';

type EmployeeDeliveryReceiptInventoryFilterProps = {
  className?: string;
};

export function EmployeeDeliveryReceiptInventoryFilter({
  className = '',
}: EmployeeDeliveryReceiptInventoryFilterProps): JSX.Element {
  const t = useTranslations('employeeDeliveryReceiptInventory.filter');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useEmployeeDeliveryReceiptInventoryFilters();

  const {
    options,
    isLoading: isLoadingOptions,
  } = useEmployeeDeliveryReceiptInventoryFilterOptions();

  // Debounce search input to avoid too many API calls
  const [debouncedSearch] = useDebounce(searchInput, 300);

  // Update search filter when debounced value changes
  React.useEffect(() => {
    updateFilter('search', debouncedSearch);
  }, [debouncedSearch, updateFilter]);

  // Initialize search input from current filter
  React.useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  }, []);

  const handleSelectChange = useCallback((key: keyof typeof filters, value: string) => {
    updateFilter(key, value);
  }, [updateFilter]);

  const handleReset = useCallback(() => {
    setSearchInput('');
    resetFilters();
  }, [resetFilters]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {/* Header with search and toggle */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          {/* Search Input */}
          <div className="max-w-md flex-1">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="size-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchInput}
                onChange={handleSearchChange}
                className="block w-full rounded-md border border-gray-300 bg-white px-10 py-2 leading-5 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:placeholder:text-gray-400 sm:text-sm"
              />
              {searchInput && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filter Toggle and Reset */}
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                {t('clear_all')}
                {' '}
                (
                {activeFilterCount}
                )
              </button>
            )}

            <button
              type="button"
              onClick={toggleExpanded}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Filter className="mr-2 size-4" />
              {t('filters')}
              {hasActiveFilters && (
                <span className="ml-1 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`ml-2 size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Filter Options */}
      {isExpanded && (
        <div className="bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Plan Filter */}
            <div>
              <label htmlFor="plan-filter" className="mb-1 block text-sm font-medium text-gray-700">
                {t('plan')}
              </label>
              <select
                id="plan-filter"
                value={filters.plan_code}
                onChange={e => handleSelectChange('plan_code', e.target.value)}
                disabled={isLoadingOptions}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm"
              >
                <option value="">{t('all_plans')}</option>
                {options?.plans.map(plan => (
                  <option key={plan.code} value={plan.code}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Filter */}
            <div>
              <label htmlFor="product-filter" className="mb-1 block text-sm font-medium text-gray-700">
                {t('product')}
              </label>
              <select
                id="product-filter"
                value={filters.product_code}
                onChange={e => handleSelectChange('product_code', e.target.value)}
                disabled={isLoadingOptions}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm"
              >
                <option value="">{t('all_products')}</option>
                {options?.products.map(product => (
                  <option key={product.code} value={product.code}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Production Step Filter */}
            <div>
              <label htmlFor="step-filter" className="mb-1 block text-sm font-medium text-gray-700">
                {t('production_step')}
              </label>
              <select
                id="step-filter"
                value={filters.production_step_code}
                onChange={e => handleSelectChange('production_step_code', e.target.value)}
                disabled={isLoadingOptions}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm"
              >
                <option value="">{t('all_steps')}</option>
                {options?.productionSteps.map(step => (
                  <option key={step.code} value={step.code}>
                    {step.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Filter */}
            <div>
              <label htmlFor="employee-filter" className="mb-1 block text-sm font-medium text-gray-700">
                {t('employee')}
              </label>
              <select
                id="employee-filter"
                value={filters.employee_id}
                onChange={e => handleSelectChange('employee_id', e.target.value)}
                disabled={isLoadingOptions}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm"
              >
                <option value="">{t('all_employees')}</option>
                {options?.employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Sort By */}
              <div>
                <label htmlFor="sort-by" className="mb-1 block text-sm font-medium text-gray-700">
                  {t('sort_by')}
                </label>
                <select
                  id="sort-by"
                  value={filters.sortBy}
                  onChange={e => handleSelectChange('sortBy', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="employee_name">{t('sort_employee_name')}</option>
                  <option value="plan_code">{t('sort_plan_code')}</option>
                  <option value="product_code">{t('sort_product_code')}</option>
                  <option value="step_code">{t('sort_step_code')}</option>
                  <option value="total_assigned">{t('sort_total_assigned')}</option>
                  <option value="total_received">{t('sort_total_received')}</option>
                  <option value="completion_rate">{t('sort_completion_rate')}</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label htmlFor="sort-order" className="mb-1 block text-sm font-medium text-gray-700">
                  {t('sort_order')}
                </label>
                <select
                  id="sort-order"
                  value={filters.sortOrder}
                  onChange={e => handleSelectChange('sortOrder', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="asc">{t('sort_ascending')}</option>
                  <option value="desc">{t('sort_descending')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
