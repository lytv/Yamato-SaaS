/**
 * OutsourceOrderReceipt List Component with Enhanced Features
 * Generated based on existing pattern from OutsourceOrderDetailList.tsx
 */

'use client';

import {
  ArrowLeft,
  Download,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useOutsourceOrderDetail } from '@/hooks/useOutsourceOrderDetails';
import { useOutsourceOrderReceiptExport } from '@/hooks/useOutsourceOrderReceiptExport';
import { useDeleteOutsourceOrderReceipt } from '@/hooks/useOutsourceOrderReceiptMutations';
import { useOutsourceOrderReceiptsByDetailId } from '@/hooks/useOutsourceOrderReceipts';
import type {
  OutsourceOrderReceiptWithRelations,
} from '@/types/outsourceOrderReceipt';

import { OutsourceOrderReceiptForm } from './OutsourceOrderReceiptForm';
import { OutsourceOrderReceiptSkeleton } from './OutsourceOrderReceiptSkeleton';
import { OutsourceOrderReceiptSummary } from './OutsourceOrderReceiptSummary';

type OutsourceOrderReceiptListProps = {
  outsourceOrderDetailId: number;
};

export function OutsourceOrderReceiptList({ outsourceOrderDetailId }: OutsourceOrderReceiptListProps) {
  const router = useRouter();
  const t = useTranslations('OutsourceOrderReceiptList');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OutsourceOrderReceiptWithRelations | null>(null);
  const [search, setSearch] = useState('');
  const [qualityFilter, setQualityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const deleteMutation = useDeleteOutsourceOrderReceipt();
  const { exportData, isExporting } = useOutsourceOrderReceiptExport();

  const {
    data: outsourceOrderReceipts = [],
    isLoading,
    error,
    refetch,
  } = useOutsourceOrderReceiptsByDetailId(outsourceOrderDetailId, true);

  const { data: orderDetail } = useOutsourceOrderDetail(outsourceOrderDetailId, true);

  // Filter data based on search and filters
  const filteredReceipts = outsourceOrderReceipts.filter((item) => {
    const matchesSearch = search === ''
      || item.receiptNumber?.toLowerCase().includes(search.toLowerCase())
      || item.receiptTitle?.toLowerCase().includes(search.toLowerCase())
      || item.batchNumber?.toLowerCase().includes(search.toLowerCase())
      || item.storageLocation?.toLowerCase().includes(search.toLowerCase())
      || item.warehouseCode?.toLowerCase().includes(search.toLowerCase())
      || item.receivedByUser?.fullName?.toLowerCase().includes(search.toLowerCase());

    const matchesQuality = qualityFilter === '' || item.qualityStatus === qualityFilter;
    const matchesStatus = statusFilter === '' || item.status === statusFilter;

    return matchesSearch && matchesQuality && matchesStatus;
  });

  const handleEdit = (item: OutsourceOrderReceiptWithRelations) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setEditingItem(null);
      refetch();
    } catch (error) {
      // Xoá dòng: console.error('Delete error:', error);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    refetch();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleExport = () => {
    exportData({
      outsourceOrderDetailId,
      search: search || undefined,
      qualityStatus: qualityFilter || undefined,
      status: statusFilter || undefined,
      format: 'csv',
      filename: `receipts_detail_${outsourceOrderDetailId}_${new Date().toISOString().slice(0, 10)}`,
    });
  };

  const formatDate = (date?: string | Date) => {
    if (!date) {
      return '';
    }
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return <OutsourceOrderReceiptSkeleton />;
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600">
          Error loading receipts:
          {error.message}
        </p>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="mr-2 size-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (isFormOpen) {
    return (
      <OutsourceOrderReceiptForm
        outsourceOrderReceipt={editingItem || undefined}
        outsourceOrderDetailId={outsourceOrderDetailId}
        isEditing={!!editingItem}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 size-4" />
              {t('back')}
            </Button>
            <h1 className="text-2xl font-bold">{t('receiptManagement')}</h1>
          </div>
          {orderDetail && (
            <p className="mt-1 text-muted-foreground">
              {orderDetail.planCode}
              {' '}
              -
              {orderDetail.productCode}
              {' '}
              -
              {orderDetail.stepCode}
              {' '}
              |
              {orderDetail.productName}
              {' '}
              (
              {orderDetail.stepName}
              )
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || filteredReceipts.length === 0}
          >
            <Download className="mr-2 size-4" />
            {isExporting ? t('exporting') : t('export')}
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('newReceipt')}
          </Button>
        </div>
      </div>

      {/* Statistics Summary */}
      <OutsourceOrderReceiptSummary
        outsourceOrderDetailId={outsourceOrderDetailId}
        className="mb-6"
      />

      {/* Filters and Search */}
      <div className="flex flex-col items-start justify-between space-y-4 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:space-y-0">
        <div className="flex flex-1 flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search receipts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quality Status Filter */}
          <Select value={qualityFilter} onValueChange={setQualityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Quality Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allQualityStatus')}</SelectItem>
              <SelectItem value="pending">{t('pending')}</SelectItem>
              <SelectItem value="passed">{t('passed')}</SelectItem>
              <SelectItem value="failed">{t('failed')}</SelectItem>
              <SelectItem value="partial">{t('partial')}</SelectItem>
              <SelectItem value="needs_rework">{t('needsRework')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Receipt Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Receipt Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allReceiptStatus')}</SelectItem>
              <SelectItem value="received">{t('received')}</SelectItem>
              <SelectItem value="inspecting">{t('inspecting')}</SelectItem>
              <SelectItem value="stored">{t('stored')}</SelectItem>
              <SelectItem value="processed">{t('processed')}</SelectItem>
              <SelectItem value="rejected">{t('rejected')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          {/* Results count */}
          <span className="text-sm text-muted-foreground">
            {filteredReceipts.length}
            {' '}
            of
            {outsourceOrderReceipts.length}
            {' '}
            receipts
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setQualityFilter('');
              setStatusFilter('');
            }}
          >
            {t('clearFilters')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt Info</TableHead>
              <TableHead>Quantities</TableHead>
              <TableHead>People</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center">
                  <div className="text-muted-foreground">
                    {search || qualityFilter || statusFilter
                      ? t('noReceiptsMatchFilters')
                      : t('noReceiptsFound')}
                  </div>
                  {(!search && !qualityFilter && !statusFilter) && (
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => setIsFormOpen(true)}
                    >
                      <Plus className="mr-2 size-4" />
                      {t('createFirstReceipt')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredReceipts.map(receipt => (
                <TableRow key={receipt.id} className="hover:bg-muted/50">
                  {/* Receipt Info */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{receipt.receiptNumber}</div>
                      {receipt.receiptTitle && (
                        <div className="text-sm text-muted-foreground">{receipt.receiptTitle}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {t('receivedOn')}
                        :
                        {' '}
                        {formatDate(receipt.receiptDate)}
                      </div>
                      {receipt.batchNumber && (
                        <div className="text-xs">
                          <Badge variant="outline" className="text-xs">
                            {receipt.batchNumber}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Quantities */}
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          {t('receivedQuantity')}
                          :
                        </span>
                        <span className="ml-1 font-medium">{receipt.receiptQuantity}</span>
                      </div>
                      {(receipt.defectQuantity || 0) > 0 && (
                        <div>
                          <span className="text-muted-foreground">
                            {t('defects')}
                            :
                          </span>
                          <span className="ml-1 font-medium text-red-600">{receipt.defectQuantity}</span>
                        </div>
                      )}
                      {(receipt.reworkQuantity || 0) > 0 && (
                        <div>
                          <span className="text-muted-foreground">
                            {t('rework')}
                            :
                          </span>
                          <span className="ml-1 font-medium text-yellow-600">{receipt.reworkQuantity}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">
                          {t('goodQuantity')}
                          :
                        </span>
                        <span className="ml-1 font-medium text-green-600">
                          {receipt.receiptQuantity - (receipt.defectQuantity || 0) - (receipt.reworkQuantity || 0)}
                        </span>
                      </div>
                    </div>
                  </TableCell>


                  {/* People */}
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          {t('receivedBy')}
                          :
                        </span>
                        <div className="font-medium">{receipt.receivedByUser?.fullName || t('unknown')}</div>
                      </div>
                      {receipt.inspectedByUser && (
                        <div>
                          <span className="text-muted-foreground">
                            {t('inspectedBy')}
                            :
                          </span>
                          <div className="font-medium">{receipt.inspectedByUser.fullName}</div>
                        </div>
                      )}
                    </div>
                  </TableCell>


                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Navigate to receipt detail view if needed
                          console.log('View receipt:', receipt.id);
                        }}
                        className="size-8 p-0"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(receipt)}
                        className="size-8 p-0"
                      >
                        <Edit className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogTitle>{t('deleteReceipt')}</AlertDialogTitle>
                          <div>
                            {t('confirmDeleteReceipt', { receiptNumber: receipt.receiptNumber })}
                            {t('deleteReceiptWarning')}
                          </div>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-outline">{t('cancel')}</button>
                            <button type="button" onClick={() => handleDelete(receipt.id)} className="btn btn-destructive">{t('delete')}</button>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
