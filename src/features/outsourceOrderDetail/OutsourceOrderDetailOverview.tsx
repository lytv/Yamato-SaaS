/**
 * OutsourceOrder Details Overview Component
 * Comprehensive view of all outsource order details across all orders
 */

'use client';

import {
  Download,
  Edit,
  Package,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
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
import { useOutsourceOrderDetails } from '@/hooks/useOutsourceOrderDetails';
import type {
  OutsourceOrderDetailFormData,
  OutsourceOrderDetailWithRelations,
} from '@/types/outsourceOrderDetail';

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
  const [search, setSearch] = useState('');

  // Get all order details (you may need to create this hook)
  const {
    data: orderDetails = [],
    isLoading,
    error,
    refetch,
  } = useOutsourceOrderDetails({ search, includeRelations: true });

  const deleteItemMutation = useDeleteOutsourceOrderDetail();
  const { exportData, isExporting } = useOutsourceOrderDetailExport();

  // Filter details based on search
  const filteredDetails = orderDetails.filter(item =>
    search === ''
    || item.planCode?.toLowerCase().includes(search.toLowerCase())
    || item.planName?.toLowerCase().includes(search.toLowerCase())
    || item.productCode?.toLowerCase().includes(search.toLowerCase())
    || item.productName?.toLowerCase().includes(search.toLowerCase())
    || item.stepCode?.toLowerCase().includes(search.toLowerCase())
    || item.stepName?.toLowerCase().includes(search.toLowerCase())
    || item.outsourceOrder?.orderCode?.toLowerCase().includes(search.toLowerCase())
    || item.itemNotes?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleEdit = (item: OutsourceOrderDetailWithRelations) => {
    setEditingItem(item);
    setIsFormOpen(true);
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded bg-white p-6 py-8 shadow">
        <p className="mb-4 text-destructive">
          Error loading order details:
          {' '}
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
      {/* Header */}
      <div className="rounded bg-white p-6 shadow">
        <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-bold">Chi tiết đơn hàng gia công</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData()}
              disabled={isExporting}
            >
              <Download className="mr-2 size-4" />
              Xuất dữ liệu
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm kiếm chi tiết..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading
          ? (
              <OutsourceOrderDetailSkeleton />
            )
          : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead>STT</TableHead>
                      <TableHead>Phiếu giao</TableHead>
                      <TableHead>Kế hoạch</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Công đoạn</TableHead>
                      <TableHead className="text-right">SL đặt</TableHead>
                      <TableHead className="text-right">SL hoàn thành</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead>Ngày dự kiến</TableHead>
                      <TableHead className="w-24 text-center">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDetails.map((item, index) => (
                      <TableRow key={item.id} className="hover:bg-blue-25">
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{item.outsourceOrder?.orderCode}</div>
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
                          <div className="text-sm font-medium">{item.stepName}</div>
                          <div className="text-xs text-gray-500">{item.stepCode}</div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{item.orderedQuantity}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-green-600">
                          {item.completedQuantity || 0}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {item.unitPrice ? `${item.unitPrice.toLocaleString()} VND` : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.expectedCompletionDate ? new Date(item.expectedCompletionDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/outsourceOrders/${item.outsourceOrderId}/details/${item.id}/receipts`)}
                              className="size-8 p-0"
                              title="Quản lý biên lai"
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
              </div>
            )}

        {filteredDetails.length === 0 && !isLoading && (
          <div className="py-8 text-center text-muted-foreground">
            {search ? 'Không tìm thấy chi tiết phù hợp.' : 'Chưa có chi tiết nào.'}
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

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-2 text-lg font-bold">Bạn chắc chắn?</h3>
            <p className="mb-4">Hành động này không thể hoàn tác. Chi tiết sẽ bị xóa vĩnh viễn.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
              <Button className="bg-destructive text-destructive-foreground" onClick={() => deleteId && handleDelete(deleteId)}>Xóa</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
