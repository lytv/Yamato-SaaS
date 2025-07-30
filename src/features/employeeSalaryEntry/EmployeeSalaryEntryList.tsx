/**
 * EmployeeSalaryEntryList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays employeeSalaryEntrys in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

import { EmployeeSalaryEntrySkeleton } from '@/features/employeeSalaryEntry/EmployeeSalaryEntrySkeleton';
import { useEmployeeSalaryEntryExport } from '@/hooks/useEmployeeSalaryEntryExport';
import { useEmployeeSalaryEntryFilters } from '@/hooks/useEmployeeSalaryEntryFilters';
import { useEmployeeSalaryEntryMutations } from '@/hooks/useEmployeeSalaryEntryMutations';
import { useEmployeeSalaryEntrys } from '@/hooks/useEmployeeSalaryEntrys';
// import { useProductionStepDetails } from '@/hooks/useProductionStepDetails';
import type { EmployeeSalaryEntryWithRelations } from '@/types/employeeSalaryEntry';


type EmployeeSalaryEntryListProps = {
  onEdit: (employeeSalaryEntry: EmployeeSalaryEntryWithRelations) => void;
  onDelete: (employeeSalaryEntry: EmployeeSalaryEntryWithRelations) => void;
};

export function EmployeeSalaryEntryList({ onEdit, onDelete }: EmployeeSalaryEntryListProps): JSX.Element {
  const { userId, orgId } = useAuth();
  const [deleteConfirmEmployeeSalaryEntry, setDeleteConfirmEmployeeSalaryEntry] = useState<EmployeeSalaryEntryWithRelations | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  // Remove showAdvancedFilters state - always show advanced filters
  
  // Advanced filter form states
  const [workDateFrom, setWorkDateFrom] = useState('');
  const [workDateTo, setWorkDateTo] = useState('');
  const [employeeCodeInput, setEmployeeCodeInput] = useState('');
  const [employeeNameInput, setEmployeeNameInput] = useState('');
  const [productCodeInput, setProductCodeInput] = useState('');
  const [productNameInput, setProductNameInput] = useState('');
  const [stepNameInput, setStepNameInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const {
    search,
    sortBy,
    sortOrder,
    workDateRange,
    employee,
    product,
    productionStep,
    status,
    handleSearchChange,
    handleSortChange,
    handleSortOrderChange,
    handleWorkDateRangeChange,
    handleEmployeeFilterChange,
    handleProductFilterChange,
    handleProductionStepFilterChange,
    handleStatusChange,
    resetAdvancedFilters,
    hasActiveFilters,
    hasAdvancedFilters,
  } = useEmployeeSalaryEntryFilters();

  const t = useTranslations('employeeSalaryEntry');

  // Get ownerId for multi-tenancy
  const ownerId = orgId || userId || '';

  const { employeeSalaryEntrys, pagination, isLoading, error, refresh } = useEmployeeSalaryEntrys({
    search,
    sortBy,
    sortOrder,
    page: showAll ? 1 : page,
    limit: 10,
    ownerId,
    showAll,
    includeRelations: true,
    // Enhanced filter parameters
    workDateFrom: workDateRange?.from,
    workDateTo: workDateRange?.to,
    employeeCode: employee?.employeeCode,
    employeeName: employee?.employeeName,
    productCode: product?.productCode,
    productName: product?.productName,
    stepName: productionStep?.stepName,
    status: status,
  });

  const { deleteEmployeeSalaryEntry, isDeleting } = useEmployeeSalaryEntryMutations();
  const { exportEmployeeSalaryEntrys, isExporting, exportError, clearError } = useEmployeeSalaryEntryExport();
  
  // Helper function to get step name
  const getStepName = (employeeSalaryEntry: EmployeeSalaryEntryWithRelations): string => {
    return employeeSalaryEntry.productionStepDetail?.stepName || t('not_specified');
  };


  // Handle delete confirmation
  const handleDeleteClick = (employeeSalaryEntry: EmployeeSalaryEntryWithRelations): void => {
    setDeleteConfirmEmployeeSalaryEntry(employeeSalaryEntry);
    setDeleteError(null);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async (): Promise<void> => {
    if (!deleteConfirmEmployeeSalaryEntry) {
      return;
    }

    try {
      await deleteEmployeeSalaryEntry(deleteConfirmEmployeeSalaryEntry.id);
      onDelete(deleteConfirmEmployeeSalaryEntry);
      setDeleteConfirmEmployeeSalaryEntry(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete employeeSalaryEntry';
      setDeleteError(errorMessage);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = (): void => {
    setDeleteConfirmEmployeeSalaryEntry(null);
    setDeleteError(null);
  };

  // Handle search input change (only update local state)
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchInput(event.target.value);
  };

  // Handle search on Enter key press
  const handleSearchKeyPress = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      handleSearchChange(searchInput.trim());
    }
  };

  // Handle clear search
  const handleClearSearch = (): void => {
    setSearchInput('');
    handleSearchChange('');
  };

  // Apply advanced filters
  const handleApplyAdvancedFilters = (): void => {
    handleWorkDateRangeChange(
      workDateFrom || undefined,
      workDateTo || undefined
    );
    handleEmployeeFilterChange(
      undefined,
      employeeCodeInput || undefined,
      employeeNameInput || undefined
    );
    handleProductFilterChange(
      undefined,
      productCodeInput || undefined,
      productNameInput || undefined
    );
    handleProductionStepFilterChange(
      undefined,
      stepNameInput || undefined
    );
    handleStatusChange(statusFilter as any || undefined);
  };

  // Clear advanced filters
  const handleClearAdvancedFilters = (): void => {
    setWorkDateFrom('');
    setWorkDateTo('');
    setEmployeeCodeInput('');
    setEmployeeNameInput('');
    setProductCodeInput('');
    setProductNameInput('');
    setStepNameInput('');
    setStatusFilter('');
    resetAdvancedFilters();
  };

  // Handle sort field change
  const handleSortFieldChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    handleSortChange(event.target.value as any);
  };

  // Handle sort order toggle
  const handleSortOrderToggle = (): void => {
    handleSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Handle export employeeSalaryEntrys
  const handleExportEmployeeSalaryEntrys = async (): Promise<void> => {
    try {
      await exportEmployeeSalaryEntrys({
        search,
        sortBy,
        sortOrder,
        workDateFrom: workDateRange?.from,
        workDateTo: workDateRange?.to,
        employeeCode: employee?.employeeCode,
        employeeName: employee?.employeeName,
        productCode: product?.productCode,
        productName: product?.productName,
        stepName: productionStep?.stepName,
        status: status,
      });
      clearError(); // Clear any previous errors
    } catch (err) {
      // Error is already handled in the hook
      console.error('Export failed:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div role="status" aria-label="Loading employeeSalaryEntrys" className="sr-only">
          Loading employeeSalaryEntrys...
        </div>
        <EmployeeSalaryEntrySkeleton data-testid="employeeSalaryEntry-list-skeleton" />
      </div>
    );
  }

  // Enhanced Error state
  if (error) {
    return (
      <div className="py-20 text-center bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border-2 border-red-200">
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-red-900 mb-2">{t('error_occurred')}</h3>
        <div className="bg-red-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
          <p className="text-lg text-red-800 font-semibold">{error}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center px-8 py-4 bg-red-600 text-white text-lg font-bold rounded-xl hover:bg-red-700 transition-colors duration-200"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
{t('retry')}
        </button>
      </div>
    );
  }

  // Remove early return for empty state - we'll handle it in the main JSX

  return (
    <div className="space-y-6 p-6">
      {/* Advanced Filter Controls */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="space-y-6">
          {/* Header with Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-xl font-bold text-gray-900">🔍 {t('advanced_filters')}</h3>
              {hasAdvancedFilters && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {Object.keys({ ...workDateRange, ...employee, ...product, ...productionStep, ...(status && {status}) }).length} {t('filters_applied')}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Show All Toggle */}
              <div className="flex items-center space-x-3 bg-white rounded-lg px-4 py-2 border border-gray-300">
                <input
                  type="checkbox"
                  id="showAll"
                  checked={showAll}
                  onChange={e => setShowAll(e.target.checked)}
                  className="size-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showAll" className="text-lg font-semibold text-gray-700 cursor-pointer">
{t('show_all')}
                </label>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 border border-gray-300">
                <label htmlFor="sortBy" className="text-lg font-semibold text-gray-700">
{t('sort_by')}
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={handleSortFieldChange}
                  aria-label={t('sort_by')}
                  className="border-0 bg-transparent text-lg font-medium focus:ring-0 focus:outline-none"
                >
                  <option value="createdAt">{t('created_date')}</option>
                  <option value="updatedAt">{t('updated_date')}</option>
                  <option value="workDate">{t('work_date')}</option>
                </select>

                <button
                  type="button"
                  onClick={handleSortOrderToggle}
                  aria-label="Sort order"
                  className="inline-flex items-center rounded-lg bg-blue-500 text-white px-3 py-1.5 text-lg font-bold hover:bg-blue-600 transition-colors"
                >
                  {sortOrder === 'desc' ? '⬇️' : '⬆️'}
                </button>
              </div>

              {/* Export Button */}
              <button
                type="button"
                onClick={handleExportEmployeeSalaryEntrys}
                disabled={isExporting || employeeSalaryEntrys.length === 0}
                aria-label="Export employeeSalaryEntrys to Excel"
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 text-lg font-bold hover:from-green-600 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg transition-all duration-200"
              >
                <Download className="mr-2 size-5" />
{isExporting ? t('exporting') : t('export')}
              </button>

            </div>
          </div>

          {/* Advanced Filter Fields */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Date Range Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">📅 {t('work_date_range')}</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={workDateFrom}
                    onChange={(e) => setWorkDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder={t('from_date')}
                  />
                  <input
                    type="date"
                    value={workDateTo}
                    onChange={(e) => setWorkDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder={t('to_date')}
                  />
                </div>
              </div>

              {/* Employee Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">👤 {t('employee_filter')}</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={employeeCodeInput}
                    onChange={(e) => setEmployeeCodeInput(e.target.value)}
                    placeholder={t('employee_code')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    type="text"
                    value={employeeNameInput}
                    onChange={(e) => setEmployeeNameInput(e.target.value)}
                    placeholder={t('employee_name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Product Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">📦 {t('product_filter')}</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={productCodeInput}
                    onChange={(e) => setProductCodeInput(e.target.value)}
                    placeholder={t('product_code')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    type="text"
                    value={productNameInput}
                    onChange={(e) => setProductNameInput(e.target.value)}
                    placeholder={t('product_name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Production Step Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">⚙️ {t('production_step_filter')}</label>
                <input
                  type="text"
                  value={stepNameInput}
                  onChange={(e) => setStepNameInput(e.target.value)}
                  placeholder={t('step_name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">🏷️ {t('status_filter')}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">{t('all_status')}</option>
                  <option value="draft">{t('draft')}</option>
                  <option value="submitted">{t('submitted')}</option>
                  <option value="approved">{t('approved')}</option>
                  <option value="paid">{t('paid')}</option>
                  <option value="cancelled">{t('cancelled')}</option>
                </select>
              </div>

              {/* General Search */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">🔍 {t('general_search')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleSearchKeyPress}
                    aria-label={t('search_placeholder')}
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleApplyAdvancedFilters}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg"
                >
                  🔍 {t('apply_filters')}
                </button>
                <button
                  type="button"
                  onClick={handleClearAdvancedFilters}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold text-lg"
                >
                  🗑️ {t('clear_filters')}
                </button>
                {(searchInput || search) && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-lg"
                  >
                    ❌ {t('clear_search')}
                  </button>
                )}
              </div>

              {/* Active Filters Display */}
              {hasAdvancedFilters && (
                <div className="flex flex-wrap gap-2">
                  {workDateRange?.from && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      📅 {t('from')}: {typeof workDateRange.from === 'string' ? workDateRange.from : workDateRange.from.toISOString().split('T')[0]}
                    </span>
                  )}
                  {workDateRange?.to && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      📅 {t('to')}: {typeof workDateRange.to === 'string' ? workDateRange.to : workDateRange.to.toISOString().split('T')[0]}
                    </span>
                  )}
                  {employee?.employeeCode && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      👤 {t('code')}: {employee.employeeCode}
                    </span>
                  )}
                  {employee?.employeeName && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      👤 {t('name')}: {employee.employeeName}
                    </span>
                  )}
                  {product?.productCode && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      📦 {t('product_code')}: {product.productCode}
                    </span>
                  )}
                  {product?.productName && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      📦 {t('product_name')}: {product.productName}
                    </span>
                  )}
                  {productionStep?.stepName && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      ⚙️ {t('step')}: {productionStep.stepName}
                    </span>
                  )}
                  {status && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      🏷️ {t('status')}: {t(status)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export Error Display */}
      {exportError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">
            {t('export_failed')}
            {' '}
            {exportError}
            <button
              type="button"
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* Show empty state only when no data AND no filters */}
      {employeeSalaryEntrys.length === 0 && !hasActiveFilters ? (
        <div className="py-20 text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-dashed border-blue-300">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('no_entries_found')}</h3>
          <p className="text-lg text-gray-600 mb-6">
            {t('create_first_entry')}
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-blue-500 text-white text-lg font-bold rounded-xl hover:bg-blue-600 transition-colors duration-200">
            {t('get_started')}
          </div>
        </div>
      ) : (
        <>
          {/* Enhanced Results Info */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {search && (
                  <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg border border-blue-200">
                    <span className="text-lg font-semibold">{t('results_for')} "{search}"</span>
                    {searchInput !== search && searchInput && (
                      <span className="ml-2 text-sm text-blue-600">
                        (Nhấn Enter để tìm "{searchInput}")
                      </span>
                    )}
                  </div>
                )}
                
                <div className="bg-green-50 text-green-800 px-4 py-2 rounded-lg border border-green-200">
                  <span className="text-lg font-semibold">
                    {t('showing')} {employeeSalaryEntrys.length} {t('of')} {pagination?.total || 0} {t('employee_salary_entries')}
                    {pagination?.page && (
                      <span className="ml-2 bg-green-200 px-2 py-1 rounded text-sm">
                        {t('page')} {pagination.page}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

      {/* Enhanced EmployeeSalaryEntrys Table */}
      <div className="overflow-x-auto rounded-xl shadow-lg">
        <table role="table" className="min-w-full">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left text-lg font-bold">
{t('employee_name')}
              </th>
              <th className="px-6 py-4 text-left text-lg font-bold">
{t('product_name')}
              </th>
              <th className="px-6 py-4 text-left text-lg font-bold">
{t('step_name')}
              </th>
              <th className="px-6 py-4 text-left text-lg font-bold">
{t('actual_quantity')}
              </th>
              <th className="px-6 py-4 text-left text-lg font-bold">
{t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {employeeSalaryEntrys.length === 0 && hasActiveFilters ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-lg">{t('no_results_with_filters')}</span>
                  </div>
                </td>
              </tr>
            ) : (
              employeeSalaryEntrys.map((employeeSalaryEntry, index) => (
              <tr key={employeeSalaryEntry.id} className={`hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <td className="px-6 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-blue-500 text-white w-10 h-10 flex items-center justify-center font-bold text-lg">
                      {(employeeSalaryEntry.userSync?.fullName || employeeSalaryEntry.userSync?.shortcut || 'N')?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {employeeSalaryEntry.userSync?.fullName || t('not_specified')}
                      </div>
                      {employeeSalaryEntry.userSync?.shortcut && (
                        <div className="text-sm text-gray-500">{t('employee_code')} {employeeSalaryEntry.userSync.shortcut}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-lg font-semibold text-gray-900">
                    {employeeSalaryEntry.product?.productName || t('not_specified')}
                  </div>
                  {employeeSalaryEntry.product?.productCode && (
                    <div className="text-sm text-gray-500">{t('product_code')} {employeeSalaryEntry.product.productCode}</div>
                  )}
                </td>
                <td className="px-6 py-5">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    {getStepName(employeeSalaryEntry)}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-2xl font-bold text-green-600">
                    {employeeSalaryEntry.actualQuantity ?? 0}
                  </div>
                  <div className="text-sm text-gray-500">{t('units')}</div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => onEdit(employeeSalaryEntry)}
                      disabled={isDeleting}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
                    >
✏️ {t('edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(employeeSalaryEntry)}
                      disabled={isDeleting}
                      className="inline-flex items-center px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200"
                    >
🗑️ {t('delete')}
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* No Results Found with Filters */}
      {employeeSalaryEntrys.length === 0 && hasActiveFilters && (
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('no_results_with_filters')}</h3>
            <p className="text-gray-600 mb-4">{t('try_adjusting_filters')}</p>
            <button
              type="button"
              onClick={() => {
                handleClearAdvancedFilters();
                handleClearSearch();
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('clear_all_filters')}
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Pagination */}
      {!showAll && pagination && pagination.total > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="bg-gray-50 px-4 py-2 rounded-lg">
              <p className="text-lg font-semibold text-gray-700">
                {t('showing')} {employeeSalaryEntrys.length} {t('of')} {pagination.total} {t('employee_salary_entries')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-lg font-bold rounded-xl hover:from-gray-600 hover:to-gray-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              >
{t('previous')}
              </button>
              
              <div className="bg-blue-500 text-white px-4 py-2 rounded-lg text-lg font-bold">
                {t('page')} {page}
              </div>
              
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={!pagination?.hasMore}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
              >
{t('next')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Dialog */}
      {deleteConfirmEmployeeSalaryEntry && (
        <div className="fixed inset-0 z-50 size-full overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative mx-auto max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-200">
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('confirm_delete')}</h3>
                
                <div className="bg-red-50 rounded-lg p-4 mb-6">
                  <p className="text-lg text-red-800 font-semibold">
                    {t('delete_confirm_message')}
                  </p>
                  <p className="text-xl font-bold text-red-900 mt-2">
                    "{deleteConfirmEmployeeSalaryEntry.userSync?.fullName || deleteConfirmEmployeeSalaryEntry.userSync?.shortcut || t('unknown_employee')}"?
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    {t('cannot_undo')}
                  </p>
                </div>
                
                {deleteError && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                    <div className="text-lg text-red-700 font-semibold">{deleteError}</div>
                  </div>
                )}
                
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={handleDeleteCancel}
                    className="px-8 py-3 bg-gray-500 text-white text-lg font-bold rounded-xl hover:bg-gray-600 transition-colors duration-200"
                  >
{t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="px-8 py-3 bg-red-600 text-white text-lg font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
                  >
{isDeleting ? t('deleting') : t('confirm_delete_btn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
}
