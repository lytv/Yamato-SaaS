/**
 * OutsourceOrderDetail List Component with Enhanced Features
 * Generated based on existing pattern from OutsourceOrderList.tsx
 */

'use client';

import {
  ArrowLeft,
  Download,
  Edit,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useOutsourceOrderDetailsByOrderId, useOutsourceOrderDetailStats } from '@/hooks/useOutsourceOrderDetails';
import { useOutsourceOrder } from '@/hooks/useOutsourceOrders';
import type {
  OutsourceOrderDetailFormData,
  OutsourceOrderDetailWithRelations,
} from '@/types/outsourceOrderDetail';

import { OutsourceOrderDetailBulkForm } from './OutsourceOrderDetailBulkForm';
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

type OutsourceOrderDetailListProps = {
  outsourceOrderId: number;
};

export function OutsourceOrderDetailList({ outsourceOrderId }: OutsourceOrderDetailListProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutsourceOrderDetailWithRelations | null>(null);
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const t = useTranslations('OrderDetailList');

  const {
    data: outsourceOrderDetails = [],
    isLoading,
    error,
    refetch,
  } = useOutsourceOrderDetailsByOrderId(outsourceOrderId, true);

  const { data: order } = useOutsourceOrder(outsourceOrderId, true);
  const { data: stats, refetch: refetchStats } = useOutsourceOrderDetailStats(outsourceOrderId);
  const deleteMutation = useDeleteOutsourceOrderDetail();
  const { exportData, isExporting } = useOutsourceOrderDetailExport();

  // Filter data based on search
  const filteredDetails = outsourceOrderDetails.filter(item =>
    search === ''
    || item.planCode?.toLowerCase().includes(search.toLowerCase())
    || item.planName?.toLowerCase().includes(search.toLowerCase())
    || item.productCode?.toLowerCase().includes(search.toLowerCase())
    || item.productName?.toLowerCase().includes(search.toLowerCase())
    || item.stepCode?.toLowerCase().includes(search.toLowerCase())
    || item.stepName?.toLowerCase().includes(search.toLowerCase())
    || item.productSub?.productSubCode?.toLowerCase().includes(search.toLowerCase())
    || item.productSub?.productSubDetail?.toLowerCase().includes(search.toLowerCase())
    || item.workTable?.locationCode?.toLowerCase().includes(search.toLowerCase())
    || item.workTable?.tableName?.toLowerCase().includes(search.toLowerCase())
    || item.itemNotes?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleEdit = (item: OutsourceOrderDetailWithRelations) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteId(null);
      refetchStats();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleBackToOrders = () => {
    router.push('/dashboard/outsourceOrders');
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredDetails.map(item => item.id));
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
    try {
      // Delete each selected item
      for (const id of selectedItems) {
        await deleteMutation.mutateAsync(id);
      }
      setSelectedItems([]);
      setShowBulkDeleteConfirm(false);
      refetchStats();
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  // Computed values for bulk selection
  const isAllSelected = filteredDetails.length > 0 && selectedItems.length === filteredDetails.length;
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < filteredDetails.length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded bg-white p-6 py-8 shadow">
        <p className="mb-4 text-destructive">
          Error loading outsourceOrderDetails:
          {error.message}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 size-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex text-sm">
        <button
          type="button"
          onClick={handleBackToOrders}
          className="text-blue-600 hover:text-blue-800"
        >
          {t('dashboard')}
        </button>
        <span className="mx-2 text-gray-400">/</span>
        <button
          type="button"
          onClick={handleBackToOrders}
          className="text-blue-600 hover:text-blue-800"
        >
          {t('outsource_orders')}
        </button>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">
          {order?.orderCode}
          {' '}
          {t('details')}
        </span>
      </nav>

      {/* Order Summary Header */}
      {order && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('order_details')}
                :
                {order.orderCode}
              </h1>
              <p className="mt-1 text-gray-600">
                {t('created_by')}
                {' '}
                {order.createdByUser?.fullName || order.createdByUserId}
                {' '}
                •
                {t('assigned_to')}
                {' '}
                {order.assignedToUser?.fullName || order.assignedToUserId}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBackToOrders}
                variant="outline"
              >
                <ArrowLeft className="mr-2 size-4" />
                Back to Orders
              </Button>
              <Button onClick={() => setIsBulkFormOpen(true)}>
                <Plus className="mr-2 size-4" />
                {t('add_detail')}
              </Button>
              <Button
                onClick={() => setIsFormOpen(true)}
                variant="outline"
                size="sm"
              >
                <Plus className="mr-2 size-4" />
                {t('add_single')}
              </Button>
            </div>
          </div>

          {/* Order Info Grid */}
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3 lg:grid-cols-5">
            <div>
              <span className="text-gray-500">{t('order_date')}</span>
              <div className="font-medium">
                {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">{t('expected_date')}</span>
              <div className="font-medium">
                {order.expectedCompletionDate ? new Date(order.expectedCompletionDate).toLocaleDateString() : '-'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">{t('status')}</span>
              <div>
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                  {order.status}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">{t('priority')}</span>
              <div className="font-medium">
                {order.priority ? `Priority ${order.priority}` : '-'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">{t('total_amount')}</span>
              <div className="font-medium text-green-600">
                {(() => {
                  const amount = Number(order.totalAmount);
                  return !Number.isNaN(amount) && Number.isFinite(amount) ? `₫ ${amount.toLocaleString()}` : '-';
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-sm text-gray-600">{t('total_items')}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.totalCompletedQuantity || 0}</div>
            <p className="text-sm text-gray-600">{t('completed_quantity')}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{stats.totalOrderedQuantity || 0}</div>
            <p className="text-sm text-gray-600">{t('ordered_quantity')}</p>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {stats.completionRate ? `${(stats.completionRate * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-sm text-gray-600">{t('completion_rate')}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">{t('order_details')}</h2>
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedItems.length}
                  {' '}
                  selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData({ outsourceOrderId, format: 'csv' })}
              disabled={isExporting}
            >
              <Download className="mr-2 size-4" />
              {t('export')}
            </Button>

            <Button onClick={() => setIsBulkFormOpen(true)} size="sm">
              <Plus className="mr-2 size-4" />
              {t('add_detail')}
            </Button>

            <Button
              onClick={() => setIsFormOpen(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="mr-2 size-4" />
              {t('add_single')}
            </Button>
          </div>
        </div>

        <div>
          {/* Search */}
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('search_details')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoading
            ? (
                <OutsourceOrderDetailSkeleton />
              )
            : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          indeterminate={isSomeSelected}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>{t('plan')}</TableHead>
                      <TableHead>{t('product')}</TableHead>
                      <TableHead>{t('product_sub')}</TableHead>
                      <TableHead>{t('location')}</TableHead>
                      <TableHead>{t('production_step')}</TableHead>
                      <TableHead className="text-right">{t('ordered_qty')}</TableHead>
                      <TableHead className="text-right">{t('completed')}</TableHead>
                      <TableHead className="text-right">{t('unit_price')}</TableHead>
                      <TableHead className="text-right">{t('total_price')}</TableHead>
                      <TableHead>{t('expected_date')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead className="w-24 text-center">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDetails.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={checked => handleSelectItem(item.id, checked as boolean)}
                            aria-label={`Select item ${item.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{item.planName}</div>
                          <div className="text-xs text-gray-500">{item.planCode}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{item.productName}</div>
                          <div className="text-xs text-gray-500">{item.productCode}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{item.productSub?.productSubDetail || '-'}</div>
                          <div className="text-xs text-gray-500">{item.productSub?.productSubCode || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{item.workTable?.tableName || '-'}</div>
                          <div className="text-xs text-gray-500">{item.workTable?.locationCode || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{item.stepName}</div>
                          <div className="text-xs text-gray-500">{item.stepCode}</div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{item.orderedQuantity}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-green-600">
                          {item.completedQuantity || 0}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {item.unitPrice
                            ? `₫ ${(typeof item.unitPrice === 'string' ? Number(item.unitPrice) : item.unitPrice).toLocaleString()}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {item.totalPrice
                            ? `₫ ${(typeof item.totalPrice === 'string' ? Number(item.totalPrice) : item.totalPrice).toLocaleString()}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.expectedCompletionDate ? new Date(item.expectedCompletionDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-1 text-xs ${
                            item.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'in_progress'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                          >
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/outsourceOrders/${outsourceOrderId}/details/${item.id}`)}
                              className="size-8 p-0"
                              title="Manage Receipts"
                            >
                              <Package className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="size-8 p-0"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(item.id)}
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
              )}

          {filteredDetails.length === 0 && !isLoading && (
            <div className="py-8 text-center text-muted-foreground">
              {search ? t('no_details_found_search') : t('no_details_found')}
            </div>
          )}
        </div>
      </div>

      {/* Single Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white">
            <OutsourceOrderDetailForm
              outsourceOrderDetail={toFormData(editingItem)}
              outsourceOrderId={outsourceOrderId}
              isEditing={!!editingItem}
              onSuccess={() => {
                setIsFormOpen(false);
                setEditingItem(null);
                refetch();
                refetchStats();
              }}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingItem(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Bulk Form Modal */}
      {isBulkFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 max-h-[90vh] w-full max-w-6xl overflow-auto rounded-lg bg-white">
            <OutsourceOrderDetailBulkForm
              outsourceOrderId={outsourceOrderId}
              onSuccess={() => {
                setIsBulkFormOpen(false);
                refetch();
                refetchStats();
              }}
              onCancel={() => {
                setIsBulkFormOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-2 text-lg font-bold">{t('are_you_sure')}</h3>
            <p className="mb-4">{t('delete_warning')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>{t('cancel')}</Button>
              <Button className="bg-destructive text-destructive-foreground" onClick={() => deleteId && handleDelete(deleteId)}>{t('delete')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-2 text-lg font-bold">Confirm Bulk Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete
              {' '}
              {selectedItems.length}
              {' '}
              selected items? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkDeleteConfirm(false)}>Cancel</Button>
              <Button
                className="bg-destructive text-destructive-foreground"
                onClick={handleBulkDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : `Delete ${selectedItems.length} Items`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
