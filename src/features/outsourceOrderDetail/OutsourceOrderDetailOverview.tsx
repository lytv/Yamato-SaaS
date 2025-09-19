/**
 * OutsourceOrder Details Overview Component
 * Comprehensive view of all outsource order details across all orders
 */

'use client';

import {
  FileText,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOutsourceOrderDetailFilters } from '@/hooks/useOutsourceOrderDetailFilters';
import { useDeleteOutsourceOrderDetail } from '@/hooks/useOutsourceOrderDetailMutations';
import { useOutsourceOrderDetailRelationOptions, useOutsourceOrderDetails } from '@/hooks/useOutsourceOrderDetails';
import type {
  OutsourceOrderDetailFormData,
  OutsourceOrderDetailWithRelations,
} from '@/types/outsourceOrderDetail';

import { OutsourceOrderBulkForm } from '../outsourceOrder/OutsourceOrderBulkForm';
import { OutsourceOrderReceiptForm } from '../outsourceOrderReceipt/OutsourceOrderReceiptForm';
import { OutsourceOrderDetailForm } from './OutsourceOrderDetailForm';
import { OutsourceOrderDetailSkeleton } from './OutsourceOrderDetailSkeleton';

function toFormData(item: OutsourceOrderDetailWithRelations | null): OutsourceOrderDetailFormData | undefined {
  if (!item) {
    return undefined;
  }
  return {
    outsourceOrderId: item.outsourceOrderId ?? 0,
    planId: item.planId ?? 0,
    productId: item.productId ?? 0,
    productionStepId: item.productionStepId ?? 0,
    planCode: item.planCode ?? '',
    planName: item.planName ?? '',
    productCode: item.productCode ?? '',
    productName: item.productName ?? '',
    stepCode: item.stepCode ?? '',
    stepName: item.stepName ?? '',
    orderedQuantity: item.orderedQuantity ?? 0,
    completedQuantity: item.completedQuantity ?? 0,
    expectedCompletionDate: item.expectedCompletionDate ?? '',
    actualCompletionDate: item.actualCompletionDate ?? undefined,
    status: item.status ?? 'pending',
    sequenceNumber: item.sequenceNumber ?? undefined,
    unitPrice: typeof item.unitPrice === 'string' ? Number(item.unitPrice) : item.unitPrice ?? undefined,
    totalPrice: typeof item.totalPrice === 'string' ? Number(item.totalPrice) : item.totalPrice ?? undefined,
    itemNotes: item.itemNotes ?? undefined,
  };
}

export function OutsourceOrderDetailOverview() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutsourceOrderDetailWithRelations | null>(null);
  const [isBulkOrderFormOpen, setIsBulkOrderFormOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showCreateReceiptForm, setShowCreateReceiptForm] = useState(false);
  const [selectedItemForReceipt, setSelectedItemForReceipt] = useState<OutsourceOrderDetailWithRelations | null>(null);
  const [showSummaryView, setShowSummaryView] = useState(false);

  // Group by options state - default all enabled
  const [groupByOptions, setGroupByOptions] = useState({
    assignedTo: true,
    plan: true,
    product: true,
    step: true,
  });

  // Use the new filters hook
  const {
    filters,
    tempFilters,
    // Manual search functions
    setTempStartDate,
    setTempEndDate,
    setTempAssignedToUserId,
    setTempProductId,
    setTempProductionStepId,
    // Quick search functions
    setTempAssignedUserSearch,
    setTempProductSearch,
    setTempProductionStepSearch,
    handleManualSearch,
    resetFilters,
    hasActiveFilters,
  } = useOutsourceOrderDetailFilters();

  // Get all order details with filters
  const {
    data: orderDetails = [],
    isLoading,
    error,
    refetch,
  } = useOutsourceOrderDetails(filters);

  // Get relation options for filters
  const { data: relationOptions } = useOutsourceOrderDetailRelationOptions();

  const deleteItemMutation = useDeleteOutsourceOrderDetail();

  // Note: filtering is now handled by the API through filters hook

  // Group data for summary view
  const groupSummaryData = () => {
    const grouped = new Map();

    orderDetails.forEach((item) => {
      const assignedTo = item.outsourceOrder?.assignedToUser?.fullName || item.outsourceOrder?.assignedToUserId || '-';
      const plan = `${item.planName}`;
      const product = `${item.productName} (${item.product?.category || ''})`;
      const step = `${item.stepName} (${item.productionStep?.filmSequence || '25'})`;

      // Build key based on selected group options
      const keyParts = [];
      if (groupByOptions.assignedTo) {
        keyParts.push(assignedTo);
      }
      if (groupByOptions.plan) {
        keyParts.push(plan);
      }
      if (groupByOptions.product) {
        keyParts.push(product);
      }
      if (groupByOptions.step) {
        keyParts.push(step);
      }

      const key = keyParts.join('|');

      if (!grouped.has(key)) {
        grouped.set(key, {
          assignedTo,
          plan,
          product,
          step,
          totalOrderedQuantity: 0,
          totalCompletedQuantity: 0,
          plannedQuantity: item.plannedQuantity || 0,
        });
      }

      const group = grouped.get(key);
      group.totalOrderedQuantity += item.orderedQuantity || 0;
      group.totalCompletedQuantity += item.completedQuantity || 0;
    });

    return Array.from(grouped.values());
  };

  const summaryData = groupSummaryData();

  // Auto-select logic for quick search
  useEffect(() => {
    if (!relationOptions) {
      return;
    }

    // Auto-select assigned user when shortcut matches exactly
    if (tempFilters.assignedUserSearch) {
      const matchedUser = relationOptions.assignedUsers?.find(
        user => user.shortcut === tempFilters.assignedUserSearch,
      );
      if (matchedUser && tempFilters.assignedToUserId !== matchedUser.id) {
        setTempAssignedToUserId(matchedUser.id);
      }
    }

    // Auto-select product when category matches exactly
    if (tempFilters.productSearch) {
      const matchedProduct = relationOptions.products?.find(
        product => product.category === tempFilters.productSearch,
      );
      if (matchedProduct && tempFilters.productId !== matchedProduct.id) {
        setTempProductId(matchedProduct.id);
      }
    }

    // Auto-select production step when sequence matches exactly
    if (tempFilters.productionStepSearch) {
      const matchedStep = relationOptions.productionSteps?.find(
        step => step.filmSequence === tempFilters.productionStepSearch,
      );
      if (matchedStep && tempFilters.productionStepId !== matchedStep.id) {
        setTempProductionStepId(matchedStep.id);
      }
    }
  }, [tempFilters.assignedUserSearch, tempFilters.productSearch, tempFilters.productionStepSearch, relationOptions, tempFilters.assignedToUserId, tempFilters.productId, tempFilters.productionStepId, setTempAssignedToUserId, setTempProductId, setTempProductionStepId]);

  const handleCreateReceipt = (item: OutsourceOrderDetailWithRelations) => {
    setSelectedItemForReceipt(item);
    setShowCreateReceiptForm(true);
  };

  const handleReceiptFormSuccess = () => {
    setShowCreateReceiptForm(false);
    setSelectedItemForReceipt(null);
    refetch();
  };

  const handleReceiptFormCancel = () => {
    setShowCreateReceiptForm(false);
    setSelectedItemForReceipt(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteItemMutation.mutateAsync(id);
      setDeleteId(null);
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(orderDetails.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      // Delete each selected item with individual error handling
      const deleteResults = [];
      const failedDeletes = [];

      for (const id of selectedItems) {
        try {
          await deleteItemMutation.mutateAsync(id);
          deleteResults.push({ id, success: true });
        } catch (error) {
          // Failed to delete item - error handled below
          deleteResults.push({ id, success: false, error });
          failedDeletes.push(id);
        }
      }

      // Show success/failure summary
      const successCount = deleteResults.filter(r => r.success).length;
      const failedCount = failedDeletes.length;

      if (successCount > 0) {
        // Successfully deleted items - could show toast here if needed
      }

      if (failedCount > 0) {
        // Failed to delete some items - handled gracefully
      }

      // Always clear selection and refresh
      setSelectedItems([]);
      setShowBulkDeleteConfirm(false);
      refetch();
    } catch {
      // Bulk delete error occurred - handled gracefully
      // Still clear selection and refresh on error
      setSelectedItems([]);
      setShowBulkDeleteConfirm(false);
      refetch();
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Auto-cleanup selectedItems when orderDetails change
  useEffect(() => {
    if (selectedItems.length > 0) {
      const currentIds = orderDetails.map(item => item.id);
      const validSelectedItems = selectedItems.filter(id => currentIds.includes(id));

      if (validSelectedItems.length !== selectedItems.length) {
        setSelectedItems(validSelectedItems);
      }
    }
  }, [orderDetails, selectedItems]);

  // Computed values for bulk selection
  const isAllSelected = orderDetails.length > 0 && selectedItems.length === orderDetails.length;
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < orderDetails.length;

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 via-orange-50 to-red-100 p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-gradient-to-r from-red-100 to-orange-100 shadow-lg">
            <RefreshCw className="size-12 text-red-600" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-red-700">
            ⚠️ Có lỗi xảy ra
          </h3>
          <p className="mb-6 text-red-600">
            {error.message || 'Không thể tải dữ liệu chi tiết đơn hàng'}
          </p>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => refetch()}
              className="bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg transition-all duration-200 hover:from-red-600 hover:to-orange-700 hover:shadow-xl"
            >
              <RefreshCw className="mr-2 size-4" />
              🔄 Thử lại
            </Button>
            <Button
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => window.location.reload()}
            >
              🔄 Tải lại trang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Gradient */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 p-6 shadow-lg">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-2">
              <Package className="size-6 text-white" />
            </div>
            <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
              Chi tiết đơn hàng gia công
            </h2>
          </div>
        </div>

        {/* Enhanced Filter Section with Dropdowns */}
        <div className="rounded-lg border border-white/50 bg-white/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700">Bộ lọc chi tiết</h4>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {/* 1. Giao Cho (Assigned To) */}
            <div className="min-w-[160px] flex-1 space-y-1">
              <label htmlFor="assigned-to-select-detail" className="text-xs font-medium text-gray-600">👤 Giao Cho</label>
              <Input
                placeholder="Tìm theo Shortcut..."
                value={tempFilters.assignedUserSearch || ''}
                onChange={e => setTempAssignedUserSearch(e.target.value || undefined)}
                className="mb-1 border-gray-300 bg-white text-xs shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <Select
                value={(tempFilters.assignedToUserId !== undefined ? tempFilters.assignedToUserId : filters.assignedToUserId) || 'all'}
                onValueChange={value => setTempAssignedToUserId(value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="assigned-to-select-detail" className="border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Chọn người thực hiện" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {relationOptions?.assignedUsers?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Sản phẩm (Product) */}
            <div className="min-w-[160px] flex-1 space-y-1">
              <label htmlFor="product-select-detail" className="text-xs font-medium text-gray-600">📦 Sản phẩm</label>
              <Input
                placeholder="Tìm theo Category..."
                value={tempFilters.productSearch || ''}
                onChange={e => setTempProductSearch(e.target.value || undefined)}
                className="mb-1 border-gray-300 bg-white text-xs shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <Select
                value={(tempFilters.productId !== undefined ? tempFilters.productId?.toString() : filters.productId?.toString()) || 'all'}
                onValueChange={value => setTempProductId(value === 'all' ? undefined : Number(value))}
              >
                <SelectTrigger id="product-select-detail" className="border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Chọn sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {relationOptions?.products?.map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.productName}
                      {' '}
                      (
                      {product.productCode}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Công đoạn (Production Step) */}
            <div className="min-w-[160px] flex-1 space-y-1">
              <label htmlFor="production-step-select-detail" className="text-xs font-medium text-gray-600">⚙️ Công đoạn</label>
              <Input
                placeholder="Tìm theo Sequence..."
                value={tempFilters.productionStepSearch || ''}
                onChange={e => setTempProductionStepSearch(e.target.value || undefined)}
                className="mb-1 border-gray-300 bg-white text-xs shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <Select
                value={(tempFilters.productionStepId !== undefined ? tempFilters.productionStepId?.toString() : filters.productionStepId?.toString()) || 'all'}
                onValueChange={value => setTempProductionStepId(value === 'all' ? undefined : Number(value))}
              >
                <SelectTrigger id="production-step-select-detail" className="border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Chọn công đoạn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {relationOptions?.productionSteps?.map(step => (
                    <SelectItem key={step.id} value={step.id.toString()}>
                      {step.stepName}
                      {' '}
                      (
                      {step.stepCode}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Từ Ngày (From Date) */}
            <div className="min-w-[140px] flex-1 space-y-1">
              <label htmlFor="start-date-input" className="text-xs font-medium text-gray-600">📅 Từ Ngày</label>
              <Input
                id="start-date-input"
                type="date"
                value={tempFilters.startDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setTempStartDate(new Date(e.target.value));
                  } else {
                    setTempStartDate(undefined);
                  }
                }}
                placeholder="Chọn từ ngày"
                className="border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* 5. Đến Ngày (To Date) */}
            <div className="min-w-[140px] flex-1 space-y-1">
              <label htmlFor="end-date-input" className="text-xs font-medium text-gray-600">📅 Đến Ngày</label>
              <Input
                id="end-date-input"
                type="date"
                value={tempFilters.endDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setTempEndDate(new Date(e.target.value));
                  } else {
                    setTempEndDate(undefined);
                  }
                }}
                placeholder="Chọn đến ngày"
                className="border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min={tempFilters.startDate?.toISOString().split('T')[0] || ''}
              />
            </div>

            {/* Summary View Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="summary-view-toggle"
                checked={showSummaryView}
                onCheckedChange={checked => setShowSummaryView(checked as boolean)}
                className="border-gray-300 bg-white"
              />
              <label htmlFor="summary-view-toggle" className="cursor-pointer text-sm font-medium text-gray-600">
                📊 Tổng
              </label>
            </div>

            {/* Group By Options - Only show when Summary View is enabled */}
            {showSummaryView && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <span className="text-xs font-medium text-blue-700">Nhóm theo:</span>

                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="group-assigned-to"
                    checked={groupByOptions.assignedTo}
                    onCheckedChange={(checked) => {
                      const newValue = checked as boolean;
                      // Ensure at least one option is always selected
                      const otherOptionsSelected = groupByOptions.plan || groupByOptions.product || groupByOptions.step;
                      if (newValue || otherOptionsSelected) {
                        setGroupByOptions(prev => ({ ...prev, assignedTo: newValue }));
                      }
                    }}
                    className="border-blue-300 bg-white"
                  />
                  <label htmlFor="group-assigned-to" className="cursor-pointer text-xs font-medium text-blue-700">
                    👤 Giao Cho
                  </label>
                </div>

                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="group-plan"
                    checked={groupByOptions.plan}
                    onCheckedChange={(checked) => {
                      const newValue = checked as boolean;
                      // Ensure at least one option is always selected
                      const otherOptionsSelected = groupByOptions.assignedTo || groupByOptions.product || groupByOptions.step;
                      if (newValue || otherOptionsSelected) {
                        setGroupByOptions(prev => ({ ...prev, plan: newValue }));
                      }
                    }}
                    className="border-blue-300 bg-white"
                  />
                  <label htmlFor="group-plan" className="cursor-pointer text-xs font-medium text-blue-700">
                    📋 Kế hoạch
                  </label>
                </div>

                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="group-product"
                    checked={groupByOptions.product}
                    onCheckedChange={(checked) => {
                      const newValue = checked as boolean;
                      // Ensure at least one option is always selected
                      const otherOptionsSelected = groupByOptions.assignedTo || groupByOptions.plan || groupByOptions.step;
                      if (newValue || otherOptionsSelected) {
                        setGroupByOptions(prev => ({ ...prev, product: newValue }));
                      }
                    }}
                    className="border-blue-300 bg-white"
                  />
                  <label htmlFor="group-product" className="cursor-pointer text-xs font-medium text-blue-700">
                    📦 Sản phẩm
                  </label>
                </div>

                <div className="flex items-center space-x-1">
                  <Checkbox
                    id="group-step"
                    checked={groupByOptions.step}
                    onCheckedChange={(checked) => {
                      const newValue = checked as boolean;
                      // Ensure at least one option is always selected
                      const otherOptionsSelected = groupByOptions.assignedTo || groupByOptions.plan || groupByOptions.product;
                      if (newValue || otherOptionsSelected) {
                        setGroupByOptions(prev => ({ ...prev, step: newValue }));
                      }
                    }}
                    className="border-blue-300 bg-white"
                  />
                  <label htmlFor="group-step" className="cursor-pointer text-xs font-medium text-blue-700">
                    ⚙️ Công đoạn
                  </label>
                </div>
              </div>
            )}

            {/* Search Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleManualSearch}
                disabled={isLoading}
                className="whitespace-nowrap bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                {isLoading
                  ? (
                      <>
                        <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Đang tìm...
                      </>
                    )
                  : (
                      <>
                        🔍 Tìm Kiếm
                      </>
                    )}
              </Button>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="whitespace-nowrap">
                  🗑️ Xóa bộ lọc
                </Button>
              )}

              {/* Create new button */}
              <Button
                size="sm"
                onClick={() => setIsBulkOrderFormOpen(true)}
                className="whitespace-nowrap bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:from-green-600 hover:to-emerald-700"
              >
                <Plus className="mr-2 size-4" />
                ⭐ Tạo mới
              </Button>

              {/* Bulk delete button - show when items selected */}
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    {selectedItems.length}
                    {' '}
                    đã chọn
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="whitespace-nowrap bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:from-red-600 hover:to-red-700"
                  >
                    <Trash2 className="mr-2 size-4" />
                    🗑️ Xóa đã chọn
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section Container */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        {/* Enhanced Table with Gradient Header */}
        {isLoading
          ? (
              <OutsourceOrderDetailSkeleton />
            )
          : showSummaryView
            ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700">
                        {groupByOptions.assignedTo && (
                          <TableHead className="px-6 py-4 text-left text-lg font-bold text-white">
                            👤 Giao Cho
                          </TableHead>
                        )}
                        {groupByOptions.plan && (
                          <TableHead className="px-6 py-4 text-left text-lg font-bold text-white">
                            📋 Kế hoạch
                          </TableHead>
                        )}
                        {groupByOptions.product && (
                          <TableHead className="px-6 py-4 text-left text-lg font-bold text-white">
                            📦 Sản phẩm
                          </TableHead>
                        )}
                        {groupByOptions.step && (
                          <TableHead className="px-6 py-4 text-left text-lg font-bold text-white">
                            ⚙️ Công đoạn
                          </TableHead>
                        )}
                        <TableHead className="px-6 py-4 text-right text-lg font-bold text-white">
                          📊 SL Đặt
                        </TableHead>
                        <TableHead className="px-6 py-4 text-right text-lg font-bold text-white">
                          ✅ SL Hoàn Thành
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaryData.map((group, index) => (
                        <TableRow
                          key={`${group.assignedTo}-${group.plan}-${group.product}-${group.step}`}
                          className={`group transition-all duration-200 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:shadow-md ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          {groupByOptions.assignedTo && (
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-blue-100">
                                  <span className="text-sm">👤</span>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {group.assignedTo}
                                </div>
                              </div>
                            </TableCell>
                          )}
                          {groupByOptions.plan && (
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-green-100">
                                  <span className="text-sm">📋</span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {group.plan}
                                  </div>
                                  <div className="text-lg font-bold text-blue-600">
                                    {group.plannedQuantity || 0}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          )}
                          {groupByOptions.product && (
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-purple-100">
                                  <span className="text-sm">📦</span>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {group.product}
                                </div>
                              </div>
                            </TableCell>
                          )}
                          {groupByOptions.step && (
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-yellow-100">
                                  <span className="text-sm">⚙️</span>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {group.step}
                                </div>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <span className="text-lg">📊</span>
                              <span className="text-sm font-bold text-blue-600">
                                {group.totalOrderedQuantity}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <span className="text-lg">✅</span>
                              <span className="text-sm font-bold text-green-600">
                                {group.totalCompletedQuantity}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            : (
                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                        <TableHead className="w-12 px-6 py-4 text-left text-lg font-bold text-white">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            indeterminate={isSomeSelected}
                            aria-label="Chọn tất cả"
                            className="border-white data-[state=checked]:bg-white data-[state=checked]:text-blue-600"
                          />
                        </TableHead>
                        <TableHead className="px-6 py-4 text-left text-lg font-bold text-white">
                          👤 Giao Cho
                        </TableHead>
                        <TableHead className="px-6 py-4 text-left text-lg font-bold text-white">
                          📅 Ngày Giao
                        </TableHead>
                        <TableHead className="px-6 py-4 text-left text-lg font-bold text-white">
                          📋 Kế hoạch
                        </TableHead>
                        <TableHead className="px-6 py-4 text-left text-lg font-bold text-white">
                          📦 Sản phẩm
                        </TableHead>
                        <TableHead className="px-6 py-4 text-left text-lg font-bold text-white">
                          ⚙️ Công đoạn
                        </TableHead>
                        <TableHead className="px-6 py-4 text-right text-lg font-bold text-white">
                          📊 SL đặt
                        </TableHead>
                        <TableHead className="px-6 py-4 text-right text-lg font-bold text-white">
                          ✅ SL hoàn thành
                        </TableHead>
                        <TableHead className="w-32 px-6 py-4 text-center text-lg font-bold text-white">
                          ⚡ Thao tác
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderDetails.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className={`group transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-md ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <TableCell className="px-6 py-4">
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={checked => handleSelectItem(item.id, checked as boolean)}
                              aria-label={`Chọn item ${item.id}`}
                            />
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex size-8 items-center justify-center rounded-full bg-blue-100">
                                <span className="text-sm">👤</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.outsourceOrder?.assignedToUser?.fullName || item.outsourceOrder?.assignedToUserId || '-'}
                                </div>
                                {item.outsourceOrder?.assignedToUser?.shortcut && (
                                  <div className="text-xs text-gray-500">
                                    {item.outsourceOrder.assignedToUser.shortcut}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">📅</span>
                              <span className="text-sm font-medium text-gray-900">
                                {item.outsourceOrder?.orderDate ? new Date(item.outsourceOrder.orderDate).toLocaleDateString('vi-VN') : '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex size-8 items-center justify-center rounded-full bg-green-100">
                                <span className="text-sm">📋</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.planName}</div>
                                <div className="text-lg font-bold text-blue-600">
                                  {item.plannedQuantity || 0}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex size-8 items-center justify-center rounded-full bg-purple-100">
                                <span className="text-sm">📦</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                <div className="text-xs text-gray-500">{item.product?.category || ''}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex size-8 items-center justify-center rounded-full bg-yellow-100">
                                <span className="text-sm">⚙️</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.stepName}</div>
                                <div className="text-xs text-gray-500">
                                  {item.productionStep?.filmSequence || '25'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <span className="text-lg">📊</span>
                              <span className="text-sm font-bold text-blue-600">{item.orderedQuantity}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <span className="text-lg">✅</span>
                              <span className="text-sm font-bold text-green-600">
                                {item.completedQuantity || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/outsourceOrders/${item.outsourceOrderId}/details/${item.id}/receipts`)}
                                className="size-10 rounded-full bg-blue-100 p-0 text-blue-600 transition-all duration-200 hover:scale-110 hover:bg-blue-200"
                                title="Quản lý biên lai"
                              >
                                <Package className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCreateReceipt(item)}
                                className="size-10 rounded-full bg-purple-100 p-0 text-purple-600 transition-all duration-200 hover:scale-110 hover:bg-purple-200"
                                title="Tạo phiếu nhập cho đơn gia công"
                              >
                                <FileText className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(item.id)}
                                className="size-10 rounded-full bg-red-100 p-0 text-red-600 transition-all duration-200 hover:scale-110 hover:bg-red-200"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

        {orderDetails.length === 0 && !isLoading && (
          <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 py-16 text-center shadow-inner">
            <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 shadow-lg">
              {hasActiveFilters
                ? (
                    <Search className="size-12 text-blue-600" />
                  )
                : (
                    <Package className="size-12 text-blue-600" />
                  )}
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">
              {hasActiveFilters ? '🔍 Không tìm thấy kết quả' : '📭 Chưa có dữ liệu'}
            </h3>
            <p className="mb-6 text-gray-500">
              {hasActiveFilters
                ? `Không có chi tiết nào phù hợp với các bộ lọc đã chọn. Hãy thử thay đổi bộ lọc.`
                : 'Chưa có chi tiết đơn hàng gia công nào. Hãy tạo mới để bắt đầu!'}
            </p>
            {!hasActiveFilters && (
              <Button
                size="lg"
                onClick={() => setIsBulkOrderFormOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl"
              >
                <Plus className="mr-2 size-5" />
                ⭐ Tạo chi tiết đầu tiên
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit Form Modal */}
      {isFormOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white">
            <OutsourceOrderDetailForm
              outsourceOrderDetail={toFormData(editingItem)}
              outsourceOrderId={editingItem.outsourceOrderId}
              isEditing
              onSuccess={() => {
                setIsFormOpen(false);
                setEditingItem(null);
                refetch();
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingItem(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-gradient-to-br from-white via-red-50 to-red-100 p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-gradient-to-r from-red-100 to-orange-100 shadow-lg">
                <Trash2 className="size-10 text-red-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-red-700">
                🗑️ Xác nhận xóa
              </h3>
              <p className="mb-6 text-red-600">
                Bạn có chắc chắn muốn xóa chi tiết này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteId(null)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  ❌ Hủy
                </Button>
                <Button
                  onClick={() => deleteId && handleDelete(deleteId)}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-xl"
                >
                  <Trash2 className="mr-2 size-4" />
                  🗑️ Xóa vĩnh viễn
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Order Form Modal */}
      {isBulkOrderFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 max-h-[90vh] w-full max-w-7xl overflow-auto rounded-lg bg-white">
            <OutsourceOrderBulkForm
              onSuccess={() => {
                setIsBulkOrderFormOpen(false);
                refetch();
              }}
              onCancel={() => {
                setIsBulkOrderFormOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-2 text-lg font-bold">Xác nhận xóa hàng loạt</h3>
            <p className="mb-4">
              Bạn có chắc chắn muốn xóa
              {' '}
              {selectedItems.length}
              {' '}
              item đã chọn? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isBulkDeleting}
              >
                Hủy
              </Button>
              <Button
                className="bg-destructive text-destructive-foreground"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting
                  ? (
                      <>
                        <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Đang xóa...
                      </>
                    )
                  : (
                      `Xóa ${selectedItems.length} items`
                    )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Receipt Form - Fullscreen */}
      {showCreateReceiptForm && selectedItemForReceipt && (
        <div className="fixed inset-0 z-50 bg-white">
          <OutsourceOrderReceiptForm
            outsourceOrderDetailId={selectedItemForReceipt.id}
            isEditing={false}
            onSuccess={handleReceiptFormSuccess}
            onCancel={handleReceiptFormCancel}
          />
        </div>
      )}
    </div>
  );
}
