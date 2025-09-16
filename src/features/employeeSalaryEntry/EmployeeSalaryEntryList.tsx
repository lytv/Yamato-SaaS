/**
 * EmployeeSalaryEntryList Component
 * Following TDD Workflow Standards - Green Phase
 * Displays employeeSalaryEntrys in table format with search, sort, pagination, and actions
 */

import { useAuth } from '@clerk/nextjs';
import { ChevronDown, ChevronUp, Download, Eye, EyeOff, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
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
  currentPage?: number;
  onPaginationUpdate?: (page: number, total: number, hasMore: boolean) => void;
  onCreateNew?: () => void;
  isCreating?: boolean;
  currentPageState?: number;
  hasMoreState?: boolean;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
};

export function EmployeeSalaryEntryList({
  onEdit,
  onDelete,
  currentPage: externalCurrentPage,
  onPaginationUpdate,
  onCreateNew,
  isCreating,
  currentPageState,
  hasMoreState,
  onPreviousPage,
  onNextPage,
}: EmployeeSalaryEntryListProps): JSX.Element {
  const { userId, orgId } = useAuth();
  const [deleteConfirmEmployeeSalaryEntry, setDeleteConfirmEmployeeSalaryEntry] = useState<EmployeeSalaryEntryWithRelations | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSummaryView, setShowSummaryView] = useState(false);

  // Advanced filter form states
  const today = new Date().toISOString().split('T')[0];
  const [workDateFrom, setWorkDateFrom] = useState(today);
  const [workDateTo, setWorkDateTo] = useState(today);
  const [employeeCodeInput, setEmployeeCodeInput] = useState('');
  const [employeeNameInput, setEmployeeNameInput] = useState('');
  const [productCodeInput, setProductCodeInput] = useState('');
  const [productNameInput, setProductNameInput] = useState('');
  const [productCategoryInput, setProductCategoryInput] = useState('');
  const [filmSequenceInput, setFilmSequenceInput] = useState('');
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

  // 🆕 Auto-apply today's date filter on component mount
  useEffect(() => {
    handleWorkDateRangeChange(today, today);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Sync external currentPage with internal page state
  useEffect(() => {
    if (externalCurrentPage && externalCurrentPage !== page) {
      setPage(externalCurrentPage);
    }
  }, [externalCurrentPage, page]);

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
    productCategory: product?.productCategory,
    stepName: productionStep?.stepName,
    filmSequence: productionStep?.filmSequence,
    status,
  });

  const { deleteEmployeeSalaryEntry, isDeleting } = useEmployeeSalaryEntryMutations();
  const { exportEmployeeSalaryEntrys, isExporting, exportError, clearError } = useEmployeeSalaryEntryExport();

  // Update parent component with pagination changes
  useEffect(() => {
    if (onPaginationUpdate && pagination) {
      onPaginationUpdate(page, pagination.total, pagination.hasMore || false);
    }
  }, [page, pagination, onPaginationUpdate]);

  // Helper function to get step name
  const getStepName = (employeeSalaryEntry: EmployeeSalaryEntryWithRelations): string => {
    return employeeSalaryEntry.productionStepDetail?.stepName || t('not_specified');
  };

  // 🆕 Helper function to group data by Employee + Product + Step
  const getGroupedData = (data: EmployeeSalaryEntryWithRelations[]) => {
    const grouped: { [key: string]: {
      employeeName: string;
      employeeCode: string;
      productName: string;
      productCode: string;
      stepName: string;
      totalQuantity: number;
      entries: EmployeeSalaryEntryWithRelations[];
    }; } = {};

    data.forEach((entry) => {
      const employeeName = entry.userSync?.fullName || t('not_specified');
      const employeeCode = entry.userSync?.shortcut || '';
      const productName = entry.product?.productName || t('not_specified');
      const productCode = entry.product?.productCode || '';
      const stepName = getStepName(entry);

      // Create unique key for grouping
      const key = `${employeeName}-${productName}-${stepName}`;

      if (!grouped[key]) {
        grouped[key] = {
          employeeName,
          employeeCode,
          productName,
          productCode,
          stepName,
          totalQuantity: 0,
          entries: [],
        };
      }

      grouped[key].totalQuantity += (entry.actualQuantity || 0);
      grouped[key].entries.push(entry);
    });

    return Object.values(grouped);
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
      workDateTo || undefined,
    );
    handleEmployeeFilterChange(
      undefined,
      employeeCodeInput || undefined,
      employeeNameInput || undefined,
    );
    handleProductFilterChange(
      undefined,
      productCodeInput || undefined,
      productNameInput || undefined,
    );
    handleProductionStepFilterChange(
      undefined,
      stepNameInput || undefined,
    );
    handleStatusChange(statusFilter as any || undefined);
  };

  // Clear quick filters
  const handleClearQuickFilters = (): void => {
    setEmployeeCodeInput('');
    setProductCategoryInput('');
    setFilmSequenceInput('');
    // Reset to today's date instead of empty
    setWorkDateFrom(today);
    setWorkDateTo(today);
  };

  // Clear advanced filters
  const handleClearAdvancedFilters = (): void => {
    setEmployeeNameInput('');
    setProductCodeInput('');
    setProductNameInput('');
    setStepNameInput('');
    setStatusFilter('');
    resetAdvancedFilters();
  };

  // Clear all filters (quick + advanced)
  const handleClearAllFilters = (): void => {
    handleClearQuickFilters();
    handleClearAdvancedFilters();
    handleClearSearch();
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
        productCategory: product?.productCategory,
        stepName: productionStep?.stepName,
        status,
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
      <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100 py-12 text-center">
        <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-red-100">
          <svg className="size-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-red-900">{t('error_occurred')}</h3>
        <div className="mx-auto mb-6 max-w-md rounded-lg bg-red-200 p-4">
          <p className="text-lg font-semibold text-red-800">{error}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center rounded-xl bg-red-600 px-8 py-4 text-lg font-bold text-white transition-colors duration-200 hover:bg-red-700"
        >
          <svg className="mr-2 size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('retry')}
        </button>
      </div>
    );
  }

  // Remove early return for empty state - we'll handle it in the main JSX

  return (
    <div className="space-y-4 p-4">
      {/* Advanced Filter Controls */}
      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 p-4 shadow-sm">
          <div className="space-y-4">
            {/* Basic Filters - Always visible */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* General Search */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    🔍
                    {t('general_search')}
                  </label>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchChange(searchInput);
                      }
                    }}
                    placeholder={t('search_placeholder')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* Quick Export */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleExportEmployeeSalaryEntrys}
                    disabled={isExporting || employeeSalaryEntrys.length === 0}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="mr-2 size-4" />
                    {isExporting ? t('exporting') : t('export')}
                  </button>
                </div>
              </div>
            </div>

            {/* Header with Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center space-x-2 text-xl font-bold text-gray-900 transition-colors hover:text-blue-600"
                >
                  <Filter className="size-5" />
                  <span>{t('advanced_filters')}</span>
                  {showAdvancedFilters
                    ? (
                        <ChevronUp className="size-5" />
                      )
                    : (
                        <ChevronDown className="size-5" />
                      )}
                </button>
                {hasAdvancedFilters && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    {Object.keys({ ...workDateRange, ...employee, ...product, ...productionStep, ...(status && { status }) }).length}
                    {' '}
                    {t('filters_applied')}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {/* Show All Toggle */}
                <div className="flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-4 py-2">
                  <input
                    type="checkbox"
                    id="showAll"
                    checked={showAll}
                    onChange={e => setShowAll(e.target.checked)}
                    className="size-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showAll" className="cursor-pointer text-lg font-semibold text-gray-700">
                    {t('show_all')}
                  </label>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2">
                  <label htmlFor="sortBy" className="text-lg font-semibold text-gray-700">
                    {t('sort_by')}
                  </label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={handleSortFieldChange}
                    aria-label={t('sort_by')}
                    className="border-0 bg-transparent text-lg font-medium focus:outline-none focus:ring-0"
                  >
                    <option value="createdAt">{t('created_date')}</option>
                    <option value="updatedAt">{t('updated_date')}</option>
                    <option value="workDate">{t('work_date')}</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleSortOrderToggle}
                    aria-label="Sort order"
                    className="inline-flex items-center rounded-lg bg-blue-500 px-3 py-1.5 text-lg font-bold text-white transition-colors hover:bg-blue-600"
                  >
                    {sortOrder === 'desc' ? '⬇️' : '⬆️'}
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Filter Fields - Collapsible */}
            {showAdvancedFilters && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                  {/* Employee Filter */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">
                      👤
                      {t('employee_filter')}
                    </label>
                    <input
                      type="text"
                      value={employeeNameInput}
                      onChange={e => setEmployeeNameInput(e.target.value)}
                      placeholder={t('employee_name')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  {/* Product Filter */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">
                      📦
                      {t('product_filter')}
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={productCodeInput}
                        onChange={e => setProductCodeInput(e.target.value)}
                        placeholder={t('product_code')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <input
                        type="text"
                        value={productNameInput}
                        onChange={e => setProductNameInput(e.target.value)}
                        placeholder={t('product_name')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  {/* Production Step Filter */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">
                      ⚙️
                      {t('production_step_filter')}
                    </label>
                    <input
                      type="text"
                      value={stepNameInput}
                      onChange={e => setStepNameInput(e.target.value)}
                      placeholder={t('step_name')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">
                      🏷️
                      {t('status_filter')}
                    </label>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                    <label className="block text-sm font-bold text-gray-700">
                      🔍
                      {t('general_search')}
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="size-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 transition-all duration-200 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Action Buttons */}
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleApplyAdvancedFilters}
                      className="rounded-lg bg-blue-500 px-6 py-2 text-lg font-semibold text-white transition-colors hover:bg-blue-600"
                    >
                      🔍
                      {' '}
                      {t('apply_filters')}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAdvancedFilters}
                      className="rounded-lg bg-gray-500 px-6 py-2 text-lg font-semibold text-white transition-colors hover:bg-gray-600"
                    >
                      🗑️
                      {' '}
                      {t('clear_filters')}
                    </button>
                    {(searchInput || search) && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        aria-label="Clear search"
                        className="rounded-lg bg-red-500 px-6 py-2 text-lg font-semibold text-white transition-colors hover:bg-red-600"
                      >
                        ❌
                        {' '}
                        {t('clear_search')}
                      </button>
                    )}
                  </div>

                  {/* Active Filters Display */}
                  {hasAdvancedFilters && (
                    <div className="flex flex-wrap gap-2">
                      {workDateRange?.from && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                          📅
                          {' '}
                          {t('from')}
                          :
                          {' '}
                          {typeof workDateRange.from === 'string' ? workDateRange.from : workDateRange.from.toISOString().split('T')[0]}
                        </span>
                      )}
                      {workDateRange?.to && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                          📅
                          {' '}
                          {t('to')}
                          :
                          {' '}
                          {typeof workDateRange.to === 'string' ? workDateRange.to : workDateRange.to.toISOString().split('T')[0]}
                        </span>
                      )}
                      {employee?.employeeCode && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                          👤
                          {' '}
                          {t('code')}
                          :
                          {' '}
                          {employee.employeeCode}
                        </span>
                      )}
                      {employee?.employeeName && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                          👤
                          {' '}
                          {t('name')}
                          :
                          {' '}
                          {employee.employeeName}
                        </span>
                      )}
                      {product?.productCode && (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
                          📦
                          {' '}
                          {t('product_code')}
                          :
                          {' '}
                          {product.productCode}
                        </span>
                      )}
                      {product?.productName && (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
                          📦
                          {' '}
                          {t('product_name')}
                          :
                          {' '}
                          {product.productName}
                        </span>
                      )}
                      {productionStep?.stepName && (
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                          ⚙️
                          {' '}
                          {t('step')}
                          :
                          {' '}
                          {productionStep.stepName}
                        </span>
                      )}
                      {status && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                          🏷️
                          {' '}
                          {t('status')}
                          :
                          {' '}
                          {t(status)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
      {employeeSalaryEntrys.length === 0 && !hasActiveFilters
        ? (
            <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 py-12 text-center">
              <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-blue-100">
                <svg className="size-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">{t('no_entries_found')}</h3>
              <p className="mb-6 text-lg text-gray-600">
                {t('create_first_entry')}
              </p>
              <div className="inline-flex items-center rounded-xl bg-blue-500 px-6 py-3 text-lg font-bold text-white transition-colors duration-200 hover:bg-blue-600">
                {t('get_started')}
              </div>
            </div>
          )
        : (
            <>
              {/* Enhanced Results Info */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Filter Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex size-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition-colors duration-200 hover:bg-gray-200"
                      title={showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                    >
                      {showFilters
                        ? (
                            <EyeOff className="size-5" />
                          )
                        : (
                            <Eye className="size-5" />
                          )}
                    </button>

                    {/* Quick Filters */}
                    <div className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
                      <span className="text-gray-600">👤</span>
                      <input
                        type="text"
                        value={employeeCodeInput}
                        onChange={e => setEmployeeCodeInput(e.target.value)}
                        placeholder={t('employee_code')}
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      />
                      <span className="text-gray-600">📦</span>
                      <input
                        type="text"
                        value={productCategoryInput}
                        onChange={e => setProductCategoryInput(e.target.value)}
                        placeholder={t('category')}
                        className="w-28 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      />
                      <span className="text-gray-600">🎬</span>
                      <input
                        type="text"
                        value={filmSequenceInput}
                        onChange={e => setFilmSequenceInput(e.target.value)}
                        placeholder={t('filmSequence')}
                        className="w-28 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      />
                      <span className="text-gray-600">📅</span>
                      <input
                        type="date"
                        value={workDateFrom}
                        onChange={e => setWorkDateFrom(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        placeholder={t('from_date')}
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="date"
                        value={workDateTo}
                        onChange={e => setWorkDateTo(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        placeholder={t('to_date')}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleWorkDateRangeChange(
                            workDateFrom || undefined,
                            workDateTo || undefined,
                          );
                          handleEmployeeFilterChange(
                            undefined,
                            employeeCodeInput || undefined,
                            undefined,
                          );
                          handleProductFilterChange(
                            undefined,
                            undefined,
                            undefined,
                            productCategoryInput || undefined,
                          );
                          handleProductionStepFilterChange(
                            undefined,
                            undefined,
                            filmSequenceInput || undefined,
                          );
                        }}
                        className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                      >
                        🔍
                        {' '}
                        {t('search')}
                      </button>

                      {/* Summary View Toggle in Quick Filter */}
                      <div className="flex items-center space-x-2 rounded border border-gray-300 bg-white px-3 py-1">
                        <input
                          type="checkbox"
                          id="showSummaryQuick"
                          checked={showSummaryView}
                          onChange={e => setShowSummaryView(e.target.checked)}
                          className="size-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor="showSummaryQuick" className="cursor-pointer text-sm font-semibold text-gray-700">
                          📊 Tổng
                        </label>
                      </div>

                      {(employeeCodeInput || productCategoryInput || filmSequenceInput || (workDateFrom && workDateFrom !== today) || (workDateTo && workDateTo !== today)) && (
                        <button
                          type="button"
                          onClick={() => {
                            handleClearQuickFilters();
                            // Clear the applied filters as well
                            handleEmployeeFilterChange(undefined, undefined, undefined);
                            handleProductFilterChange(undefined, undefined, undefined, undefined);
                            handleProductionStepFilterChange(undefined, undefined, undefined);
                            // Reset work date to today instead of undefined
                            handleWorkDateRangeChange(today, today);
                          }}
                          className="rounded bg-gray-500 px-2 py-1 text-sm font-medium text-white transition-colors hover:bg-gray-600"
                          title="Clear quick filters"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                    {search && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-blue-800">
                        <span className="text-lg font-semibold">
                          {t('results_for')}
                          {' '}
                          "
                          {search}
                          "
                        </span>
                        {searchInput !== search && searchInput && (
                          <span className="ml-2 text-sm text-blue-600">
                            (Nhấn Enter để tìm "
                            {searchInput}
                            ")
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced EmployeeSalaryEntrys Table - Detail View */}
              {!showSummaryView && (
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
                      {employeeSalaryEntrys.length === 0 && hasActiveFilters
                        ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                <div className="flex items-center justify-center">
                                  <svg className="mr-3 size-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-lg">{t('no_results_with_filters')}</span>
                                </div>
                              </td>
                            </tr>
                          )
                        : (
                            employeeSalaryEntrys.map((employeeSalaryEntry, index) => (
                              <tr key={employeeSalaryEntry.id} className={`border-b border-gray-100 transition-colors duration-200 hover:bg-blue-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                <td className="px-6 py-5">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
                                      {(employeeSalaryEntry.userSync?.fullName || employeeSalaryEntry.userSync?.shortcut || 'N')?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-lg font-bold text-gray-900">
                                        {employeeSalaryEntry.userSync?.fullName || t('not_specified')}
                                      </div>
                                      {employeeSalaryEntry.userSync?.shortcut && (
                                        <div className="text-sm text-gray-500">
                                          {t('employee_code')}
                                          {' '}
                                          {employeeSalaryEntry.userSync.shortcut}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="text-lg font-semibold text-gray-900">
                                    {employeeSalaryEntry.product?.productName || t('not_specified')}
                                  </div>
                                  {employeeSalaryEntry.product?.productCode && (
                                    <div className="text-sm text-gray-500">
                                      {t('product_code')}
                                      {' '}
                                      {employeeSalaryEntry.product.productCode}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-5">
                                  <div className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
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
                                      className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white transition-colors duration-200 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      ✏️
                                      {' '}
                                      {t('edit')}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteClick(employeeSalaryEntry)}
                                      disabled={isDeleting}
                                      className="inline-flex items-center rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition-colors duration-200 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      🗑️
                                      {' '}
                                      {t('delete')}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 🆕 Enhanced EmployeeSalaryEntrys Grouped/Summary Table */}
              {showSummaryView && (
                <div className="overflow-x-auto rounded-xl shadow-lg">
                  <table role="table" className="min-w-full">
                    <thead className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-lg font-bold">
                          📊
                          {' '}
                          {t('employee_name')}
                        </th>
                        <th className="px-6 py-4 text-left text-lg font-bold">
                          📦
                          {' '}
                          {t('product_name')}
                        </th>
                        <th className="px-6 py-4 text-left text-lg font-bold">
                          ⚙️
                          {' '}
                          {t('step_name')}
                        </th>
                        <th className="px-6 py-4 text-left text-lg font-bold">
                          🔢
                          {' '}
                          {t('total_quantity')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {employeeSalaryEntrys.length === 0 && hasActiveFilters
                        ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                <div className="flex items-center justify-center">
                                  <svg className="mr-3 size-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-lg">{t('no_results_with_filters')}</span>
                                </div>
                              </td>
                            </tr>
                          )
                        : (
                            getGroupedData(employeeSalaryEntrys).map((groupedEntry, index) => (
                              <tr key={`${groupedEntry.employeeName}-${groupedEntry.productName}-${groupedEntry.stepName}`} className={`border-b border-gray-100 transition-colors duration-200 hover:bg-green-50 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                <td className="px-6 py-5">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-green-500 text-lg font-bold text-white">
                                      {groupedEntry.employeeName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-lg font-bold text-gray-900">
                                        {groupedEntry.employeeName}
                                      </div>
                                      {groupedEntry.employeeCode && (
                                        <div className="text-sm text-gray-500">
                                          {t('employee_code')}
                                          {' '}
                                          {groupedEntry.employeeCode}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="text-lg font-semibold text-gray-900">
                                    {groupedEntry.productName}
                                  </div>
                                  {groupedEntry.productCode && (
                                    <div className="text-sm text-gray-500">
                                      {t('product_code')}
                                      {' '}
                                      {groupedEntry.productCode}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-5">
                                  <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                    {groupedEntry.stepName}
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="text-2xl font-bold text-green-600">
                                    {groupedEntry.totalQuantity}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {t('units')}
                                    {' '}
                                    (
                                    {groupedEntry.entries.length}
                                    {' '}
                                    entries)
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* No Results Found with Filters */}
              {employeeSalaryEntrys.length === 0 && hasActiveFilters && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-yellow-100">
                      <svg className="size-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900">{t('no_results_with_filters')}</h3>
                    <p className="mb-4 text-gray-600">{t('try_adjusting_filters')}</p>
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-600"
                    >
                      <svg className="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {t('clear_all_filters')}
                    </button>
                  </div>
                </div>
              )}

              {/* Enhanced Delete Confirmation Dialog */}
              {deleteConfirmEmployeeSalaryEntry && (
                <div className="fixed inset-0 z-50 size-full overflow-y-auto bg-black/60 backdrop-blur-sm">
                  <div className="flex min-h-screen items-center justify-center p-4">
                    <div className="relative mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
                      <div className="p-6 text-center">
                        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-red-100">
                          <svg className="size-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>

                        <h3 className="mb-4 text-2xl font-bold text-gray-900">{t('confirm_delete')}</h3>

                        <div className="mb-6 rounded-lg bg-red-50 p-4">
                          <p className="text-lg font-semibold text-red-800">
                            {t('delete_confirm_message')}
                          </p>
                          <p className="mt-2 text-xl font-bold text-red-900">
                            "
                            {deleteConfirmEmployeeSalaryEntry.userSync?.fullName || deleteConfirmEmployeeSalaryEntry.userSync?.shortcut || t('unknown_employee')}
                            "?
                          </p>
                          <p className="mt-2 text-sm text-red-600">
                            {t('cannot_undo')}
                          </p>
                        </div>

                        {deleteError && (
                          <div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3">
                            <div className="text-lg font-semibold text-red-700">{deleteError}</div>
                          </div>
                        )}

                        <div className="flex justify-center space-x-4">
                          <button
                            type="button"
                            onClick={handleDeleteCancel}
                            className="rounded-xl bg-gray-500 px-8 py-3 text-lg font-bold text-white transition-colors duration-200 hover:bg-gray-600"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="rounded-xl bg-red-600 px-8 py-3 text-lg font-bold text-white transition-colors duration-200 hover:bg-red-700 disabled:opacity-50"
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

      {/* Employee Salary Management Header - Moved to Bottom */}
      <div className="mt-4">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-4 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-white/20 p-2">
                  <svg className="size-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    💰
                    {' '}
                    {t('pageTitle')}
                  </h1>
                  <p className="text-lg text-white/90">
                    {t('pageDescription')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Mini Pagination Controls */}
              <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={onPreviousPage}
                  className="flex items-center justify-center rounded-lg bg-white/20 px-3 py-2 text-sm font-bold text-white transition-all hover:bg-white/30 disabled:opacity-50"
                  disabled={(currentPageState || page) <= 1}
                >
                  <span className="mr-1">←</span>
                  {' '}
                  {t('previous')}
                </button>

                <div className="rounded-lg bg-white/30 px-3 py-2 text-sm font-bold text-white">
                  {t('page')}
                  {' '}
                  {currentPageState || page}
                </div>

                <button
                  type="button"
                  onClick={onNextPage}
                  className="flex items-center justify-center rounded-lg bg-white/20 px-3 py-2 text-sm font-bold text-white transition-all hover:bg-white/30 disabled:opacity-50"
                  disabled={!(hasMoreState ?? pagination?.hasMore)}
                >
                  {t('next')}
                  {' '}
                  <span className="ml-1">→</span>
                </button>
              </div>

              {onCreateNew && (
                <Button
                  onClick={onCreateNew}
                  disabled={isCreating}
                  size="lg"
                  className="h-10 border-0 bg-white px-6 text-base font-bold text-blue-600 shadow-lg hover:bg-blue-50"
                >
                  <svg className="mr-2 size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('createNew')}
                </Button>
              )}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-10 -top-10 size-20 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-8 -left-8 size-16 rounded-full bg-white/5"></div>
        </header>
      </div>
    </div>
  );
}
