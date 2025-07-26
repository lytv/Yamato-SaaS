/**
 * Integrated OutsourceOrder List Component with Master-Detail View
 * Combines outsource orders list with their details in a single interface
 */

'use client';

import {
  ChevronDown,
  ChevronRight,
  Download,
  Edit,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOutsourceOrderDetailExport } from '@/hooks/useOutsourceOrderDetailExport';
import { useDeleteOutsourceOrderDetail } from '@/hooks/useOutsourceOrderDetailMutations';
import { useOutsourceOrderDetailsByOrderId } from '@/hooks/useOutsourceOrderDetails';
import { useOutsourceOrderExport } from '@/hooks/useOutsourceOrderExport';
import { useOutsourceOrderFilters } from '@/hooks/useOutsourceOrderFilters';
import { useDeleteOutsourceOrder } from '@/hooks/useOutsourceOrderMutations';
import { useOutsourceOrders, useOutsourceOrderStats } from '@/hooks/useOutsourceOrders';
import type { 
  OutsourceOrderFormData, 
  OutsourceOrderWithRelations 
} from '@/types/outsourceOrder';
import type {
  OutsourceOrderDetailFormData,
  OutsourceOrderDetailWithRelations,
} from '@/types/outsourceOrderDetail';

import { OutsourceOrderForm } from './OutsourceOrderForm';
import { OutsourceOrderSkeleton } from './OutsourceOrderSkeleton';
import { OutsourceOrderDetailForm } from '../outsourceOrderDetail/OutsourceOrderDetailForm';
import { OutsourceOrderDetailSkeleton } from '../outsourceOrderDetail/OutsourceOrderDetailSkeleton';

function toOrderFormData(item: OutsourceOrderWithRelations | null): OutsourceOrderFormData | undefined {
  if (!item) {
    return undefined;
  }
  return {
    orderCode: item.orderCode ?? '',
    orderTitle: item.orderTitle ?? undefined,
    createdByUserId: item.createdByUserId ?? '',
    assignedToUserId: item.assignedToUserId ?? '',
    orderDate: item.orderDate ?? '',
    expectedCompletionDate: item.expectedCompletionDate ?? undefined,
    actualCompletionDate: item.actualCompletionDate ?? undefined,
    status: item.status ?? '',
    priority: typeof item.priority === 'number' ? item.priority : 0,
    totalAmount: typeof item.totalAmount === 'number' ? item.totalAmount : (item.totalAmount ? Number(item.totalAmount) : undefined),
    currency: item.currency ?? undefined,
    notes: item.notes ?? undefined,
    attachment: item.attachment ?? undefined,
    applyRetailPrice: item.applyRetailPrice ?? 2,
  };
}

function toDetailFormData(item: OutsourceOrderDetailWithRelations | null): OutsourceOrderDetailFormData | undefined {
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

export function OutsourceOrderIntegratedList() {
  const t = useTranslations('outsourceOrder.list');
  const router = useRouter();
  
  // Order states
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OutsourceOrderWithRelations | null>(null);
  
  // Detail states
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [deleteDetailId, setDeleteDetailId] = useState<number | null>(null);
  const [isDetailFormOpen, setIsDetailFormOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<OutsourceOrderDetailWithRelations | null>(null);
  const [detailSearch, setDetailSearch] = useState('');

  const { filters, setSearch, resetFilters, hasActiveFilters } = useOutsourceOrderFilters();

  // Order data
  const {
    data: outsourceOrders = [],
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useOutsourceOrders({ ...filters, includeRelations: true });

  const { data: orderStats } = useOutsourceOrderStats();
  const deleteOrderMutation = useDeleteOutsourceOrder();
  const { exportData: exportOrders, isExporting: isExportingOrders } = useOutsourceOrderExport();

  // Detail data (only load when expanded)
  const {
    data: orderDetails = [],
    isLoading: detailsLoading,
    refetch: refetchDetails,
  } = useOutsourceOrderDetailsByOrderId(expandedOrderId || 0, expandedOrderId !== null);

  // const { data: detailStats } = useOutsourceOrderDetailStats(expandedOrderId || 0);
  
  const deleteDetailMutation = useDeleteOutsourceOrderDetail();
  const { exportData: exportDetails, isExporting: isExportingDetails } = useOutsourceOrderDetailExport();

  // Filter details based on search
  const filteredDetails = orderDetails.filter(item =>
    detailSearch === ''
    || item.planCode?.toLowerCase().includes(detailSearch.toLowerCase())
    || item.planName?.toLowerCase().includes(detailSearch.toLowerCase())
    || item.productCode?.toLowerCase().includes(detailSearch.toLowerCase())
    || item.productName?.toLowerCase().includes(detailSearch.toLowerCase())
    || item.stepCode?.toLowerCase().includes(detailSearch.toLowerCase())
    || item.stepName?.toLowerCase().includes(detailSearch.toLowerCase())
    || item.itemNotes?.toLowerCase().includes(detailSearch.toLowerCase()),
  );

  const handleEditOrder = (item: OutsourceOrderWithRelations) => {
    setEditingOrder(item);
    setIsOrderFormOpen(true);
  };

  const handleDeleteOrder = async (id: number) => {
    try {
      await deleteOrderMutation.mutateAsync(id);
      setDeleteOrderId(null);
      if (expandedOrderId === id) {
        setExpandedOrderId(null);
      }
    } catch (error) {
      console.error('Delete order error:', error);
    }
  };

  const handleToggleDetails = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    setDetailSearch(''); // Reset detail search when switching
  };

  const handleEditDetail = (item: OutsourceOrderDetailWithRelations) => {
    setEditingDetail(item);
    setIsDetailFormOpen(true);
  };

  const handleDeleteDetail = async (id: number) => {
    try {
      await deleteDetailMutation.mutateAsync(id);
      setDeleteDetailId(null);
      refetchDetails();
    } catch (error) {
      console.error('Delete detail error:', error);
    }
  };

  const handleAddDetail = (orderId: number) => {
    setExpandedOrderId(orderId);
    setEditingDetail(null);
    setIsDetailFormOpen(true);
  };

  if (ordersError) {
    return (
      <div className="flex flex-col items-center justify-center rounded bg-white p-6 py-8 shadow">
        <p className="mb-4 text-destructive">
          {t('error_loading')}
          {ordersError.message}
        </p>
        <Button onClick={() => refetchOrders()} variant="outline">
          <RefreshCw className="mr-2 size-4" />
          {t('retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      {orderStats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded bg-white p-4 shadow">
            <div className="text-2xl font-bold">{orderStats.total}</div>
            <p className="text-xs text-muted-foreground">{t('total')}</p>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-2xl font-bold">{orderStats.today}</div>
            <p className="text-xs text-muted-foreground">{t('created_today')}</p>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-2xl font-bold">{orderStats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">{t('this_week')}</p>
          </div>
          <div className="rounded bg-white p-4 shadow">
            <div className="text-2xl font-bold">{orderStats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">{t('this_month')}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 rounded bg-white p-6 shadow">
        <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-bold">{t('title')}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportOrders()}
              disabled={isExportingOrders}
            >
              <Download className="mr-2 size-4" />
              {t('export')}
            </Button>

            <Button onClick={() => setIsOrderFormOpen(true)}>
              <Plus className="mr-2 size-4" />
              {t('add')}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('search_placeholder')}
                value={filters.search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="outline" onClick={resetFilters}>
              {t('clear_filters')}
            </Button>
          )}
        </div>

        {/* Orders Table */}
        {ordersLoading ? (
          <OutsourceOrderSkeleton />
        ) : (
          <div className="space-y-3">
            {outsourceOrders.map(order => (
              <div key={order.id} className="border-2 rounded-lg shadow-sm">
                {/* Order Row */}
                <div className="bg-blue-50 hover:bg-blue-100 border-b border-blue-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>{t('table.order_code')}</TableHead>
                        <TableHead>{t('table.created_by')}</TableHead>
                        <TableHead>{t('table.assigned_to')}</TableHead>
                        <TableHead>{t('table.order_date')}</TableHead>
                        <TableHead>{t('table.apply_retail_price')}</TableHead>
                        <TableHead className="w-32">{t('table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleDetails(order.id)}
                            className="size-8 p-0"
                          >
                            {expandedOrderId === order.id ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-bold text-blue-800">
                          📋 {order.orderCode}
                        </TableCell>
                        <TableCell className="font-medium text-blue-700">{order.createdByUser?.fullName || order.createdByUserId}</TableCell>
                        <TableCell className="font-medium text-blue-700">{order.assignedToUser?.fullName || order.assignedToUserId}</TableCell>
                        <TableCell className="font-medium text-blue-700">
                          {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            order.applyRetailPrice === 3 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {/* Debug display */}
                            [{order.applyRetailPrice}] {order.applyRetailPrice === 3 ? t('price_type_retail') : t('price_type_normal')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddDetail(order.id)}
                              className="size-8 p-0"
                              title={t('add_detail_tooltip')}
                            >
                              <Plus className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditOrder(order)}
                              className="size-8 p-0"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteOrderId(order.id)}
                              className="size-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Expanded Details Section */}
                {expandedOrderId === order.id && (
                  <div className="border-t bg-amber-25 p-6" style={{ backgroundColor: '#fffbeb' }}>

                    {/* Detail Controls */}
                    <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                      <h3 className="text-md font-semibold text-indigo-700">📋 {t('order_details_title')}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportDetails({ outsourceOrderId: order.id, format: 'csv' })}
                          disabled={isExportingDetails}
                        >
                          <Download className="mr-2 size-4" />
                          {t('export_details')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddDetail(order.id)}
                        >
                          <Plus className="mr-2 size-4" />
                          {t('add_detail')}
                        </Button>
                      </div>
                    </div>

                    {/* Detail Search */}
                    <div className="mb-4">
                      <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder={t('search_details_placeholder')}
                          value={detailSearch}
                          onChange={e => setDetailSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Details Table */}
                    {detailsLoading ? (
                      <OutsourceOrderDetailSkeleton />
                    ) : (
                      <div className="rounded-lg border-2 border-indigo-200 overflow-hidden">
                        <Table className="bg-white">
                        <TableHeader>
                          <TableRow className="bg-indigo-100">
                            <TableHead className="text-indigo-800 font-semibold">{t('detail_table.sequence')}</TableHead>
                            <TableHead className="text-indigo-800 font-semibold">{t('detail_table.plan')}</TableHead>
                            <TableHead className="text-indigo-800 font-semibold">{t('detail_table.product')}</TableHead>
                            <TableHead className="text-indigo-800 font-semibold">{t('detail_table.production_step')}</TableHead>
                            <TableHead className="text-right text-indigo-800 font-semibold">{t('detail_table.ordered_qty')}</TableHead>
                            <TableHead className="text-right text-indigo-800 font-semibold">{t('detail_table.completed')}</TableHead>
                            <TableHead className="w-24 text-center text-indigo-800 font-semibold">{t('detail_table.actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDetails.map((item, index) => (
                            <TableRow key={item.id} className="hover:bg-indigo-25 even:bg-gray-50" style={{ backgroundColor: index % 2 === 1 ? '#f8fafc' : 'white' }}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">{item.planCode}</div>
                                <div className="text-xs text-gray-500">{item.planName}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">{item.productCode}</div>
                                <div className="text-xs text-gray-500">{item.productName}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">{item.stepCode}</div>
                                <div className="text-xs text-gray-500">{item.stepName}</div>
                              </TableCell>
                              <TableCell className="text-right text-sm">{item.orderedQuantity}</TableCell>
                              <TableCell className="text-right text-sm font-medium text-green-600">
                                {item.completedQuantity || 0}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/dashboard/outsourceOrders/${order.id}/details/${item.id}/receipts`)}
                                    className="size-8 p-0"
                                    title={t('manage_receipts_tooltip')}
                                  >
                                    <Package className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditDetail(item)}
                                    className="size-8 p-0"
                                  >
                                    <Edit className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteDetailId(item.id)}
                                    className="size-8 p-0 text-destructive hover:text-destructive"
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

                    {filteredDetails.length === 0 && !detailsLoading && (
                      <div className="py-8 text-center text-muted-foreground bg-indigo-25 rounded-lg border-2 border-indigo-200" style={{ backgroundColor: '#f0f9ff' }}>
                        {detailSearch ? t('detail_empty_search') : t('detail_empty')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {outsourceOrders.length === 0 && !ordersLoading && (
          <div className="py-8 text-center text-muted-foreground">
            {t('empty')}
          </div>
        )}
      </div>

      {/* Order Form Modal */}
      {isOrderFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white">
            <OutsourceOrderForm
              outsourceOrder={toOrderFormData(editingOrder)}
              isEditing={!!editingOrder}
              onSuccess={() => {
                setIsOrderFormOpen(false);
                setEditingOrder(null);
                refetchOrders();
              }}
              onCancel={() => {
                setIsOrderFormOpen(false);
                setEditingOrder(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Detail Form Modal */}
      {isDetailFormOpen && expandedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white">
            <OutsourceOrderDetailForm
              outsourceOrderDetail={toDetailFormData(editingDetail)}
              outsourceOrderId={expandedOrderId}
              isEditing={!!editingDetail}
              onSuccess={() => {
                setIsDetailFormOpen(false);
                setEditingDetail(null);
                refetchDetails();
              }}
              onCancel={() => {
                setIsDetailFormOpen(false);
                setEditingDetail(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Order Confirmation */}
      {deleteOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-2 text-lg font-bold">{t('delete_confirm_title')}</h3>
            <p className="mb-4">{t('delete_confirm_desc')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteOrderId(null)}>{t('cancel')}</Button>
              <Button className="bg-destructive text-destructive-foreground" onClick={() => deleteOrderId && handleDeleteOrder(deleteOrderId)}>{t('delete')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Detail Confirmation */}
      {deleteDetailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-2 text-lg font-bold">{t('detail_delete_confirm_title')}</h3>
            <p className="mb-4">{t('detail_delete_confirm_desc')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDetailId(null)}>{t('cancel')}</Button>
              <Button className="bg-destructive text-destructive-foreground" onClick={() => deleteDetailId && handleDeleteDetail(deleteDetailId)}>{t('delete')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}