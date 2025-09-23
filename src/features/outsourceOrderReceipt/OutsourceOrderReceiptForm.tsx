/**
 * OutsourceOrderReceipt Form Component with Enhanced Features
 * Generated based on existing pattern from OutsourceOrderDetailForm.tsx
 */

'use client';

import { useAuth } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle, FileText, Package } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateOutsourceOrderReceipt,
  useUpdateOutsourceOrderReceipt,
} from '@/hooks/useOutsourceOrderReceiptMutations';
import { useOutsourceOrderReceiptRelationOptions, useOutsourceOrderReceiptsByDetailId } from '@/hooks/useOutsourceOrderReceipts';
import { outsourceOrderReceiptFormSchema } from '@/libs/validations/outsourceOrderReceipt';
import type { OutsourceOrderReceiptFormData, OutsourceOrderReceiptWithRelations } from '@/types/outsourceOrderReceipt';

type OutsourceOrderReceiptFormProps = {
  outsourceOrderReceipt?: OutsourceOrderReceiptWithRelations;
  outsourceOrderDetailId?: number;
  isEditing: boolean;
  onSuccess: () => void;
  onCancel: () => void;
};

export function OutsourceOrderReceiptForm({
  outsourceOrderReceipt,
  outsourceOrderDetailId,
  isEditing,
  onSuccess,
  onCancel,
}: OutsourceOrderReceiptFormProps) {
  const { userId } = useAuth();
  const { data: relationOptions } = useOutsourceOrderReceiptRelationOptions(outsourceOrderDetailId);
  const createMutation = useCreateOutsourceOrderReceipt();
  const updateMutation = useUpdateOutsourceOrderReceipt();
  // const t = useTranslations('OutsourceOrderReceiptForm');

  const form = useForm<OutsourceOrderReceiptFormData>({
    resolver: zodResolver(outsourceOrderReceiptFormSchema),
    defaultValues: {
      outsourceOrderDetailId: outsourceOrderDetailId || outsourceOrderReceipt?.outsourceOrderDetailId || 0,
      receiptNumber: outsourceOrderReceipt?.receiptNumber || '',
      receiptTitle: outsourceOrderReceipt?.receiptTitle || '',
      receiptQuantity: outsourceOrderReceipt?.receiptQuantity || 0,
      receiptDate: outsourceOrderReceipt?.receiptDate ? new Date(outsourceOrderReceipt.receiptDate) : new Date(),
      plannedReceiptDate: outsourceOrderReceipt?.plannedReceiptDate ? new Date(outsourceOrderReceipt.plannedReceiptDate) : undefined,
      qualityStatus: outsourceOrderReceipt?.qualityStatus || 'pending',
      qualityScore: outsourceOrderReceipt?.qualityScore || undefined,
      defectQuantity: outsourceOrderReceipt?.defectQuantity || 0,
      reworkQuantity: outsourceOrderReceipt?.reworkQuantity || 0,
      qualityNotes: outsourceOrderReceipt?.qualityNotes || '',
      receivedByUserId: isEditing
        ? outsourceOrderReceipt?.receivedByUserId || ''
        : userId || '',
      inspectedByUserId: outsourceOrderReceipt?.inspectedByUserId || '',
      deliveredByUserId: outsourceOrderReceipt?.deliveredByUserId || '',
      batchNumber: outsourceOrderReceipt?.batchNumber || '',
      storageLocation: outsourceOrderReceipt?.storageLocation || '',
      warehouseCode: outsourceOrderReceipt?.warehouseCode || '',
      actualUnitCost: typeof outsourceOrderReceipt?.actualUnitCost === 'string' ? Number(outsourceOrderReceipt.actualUnitCost) : outsourceOrderReceipt?.actualUnitCost || undefined,
      totalCost: typeof outsourceOrderReceipt?.totalCost === 'string' ? Number(outsourceOrderReceipt.totalCost) : outsourceOrderReceipt?.totalCost || undefined,
      notes: outsourceOrderReceipt?.notes || '',
      attachments: outsourceOrderReceipt?.attachments || '',
      status: outsourceOrderReceipt?.status || 'received',
      isPartialReceipt: outsourceOrderReceipt?.isPartialReceipt ?? true,
    },
  });

  // Get current receipts for this detail to calculate actual completed quantity
  const selectedDetailId = form.watch('outsourceOrderDetailId');
  const { data: existingReceipts = [] } = useOutsourceOrderReceiptsByDetailId(
    selectedDetailId || outsourceOrderDetailId || 0,
    !!(selectedDetailId || outsourceOrderDetailId),
  );

  const selectedDetail = relationOptions?.outsourceOrderDetails.find(
    detail => detail.id === (selectedDetailId || outsourceOrderDetailId),
  );

  // Auto-generate receipt number if creating new
  useEffect(() => {
    if (!isEditing && !form.getValues('receiptNumber')) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
      form.setValue('receiptNumber', `REC${timestamp}`);
    }
  }, [isEditing, form]);

  const onSubmit = async (data: OutsourceOrderReceiptFormData) => {
    try {
      // Simplified data with auto-filled defaults
      const submitData = {
        outsourceOrderDetailId: data.outsourceOrderDetailId,
        receiptNumber: data.receiptNumber,
        receiptTitle: data.receiptTitle || `Receipt for ${selectedDetail?.planCode || 'Order'}`,
        receiptQuantity: data.receiptQuantity,
        receiptDate: new Date(),
        plannedReceiptDate: undefined,
        qualityStatus: 'pending',
        qualityScore: undefined,
        defectQuantity: 0,
        reworkQuantity: 0,
        qualityNotes: '',
        receivedByUserId: userId || '',
        inspectedByUserId: undefined,
        deliveredByUserId: undefined,
        batchNumber: '',
        storageLocation: '',
        warehouseCode: '',
        actualUnitCost: undefined,
        totalCost: undefined,
        notes: data.notes || '',
        attachments: '',
        status: 'received',
        isPartialReceipt: true,
      };

      if (isEditing && outsourceOrderReceipt) {
        await updateMutation.mutateAsync({
          id: outsourceOrderReceipt.id,
          data: submitData,
        });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Calculate actual completed quantity from existing receipts
  const actualCompletedQuantity = existingReceipts.reduce((total, receipt) => {
    return total + (receipt.receiptQuantity || 0);
  }, 0);

  // Calculate remaining quantity for display (original ordered - completed)
  const displayRemainingQuantity = selectedDetail
    ? selectedDetail.orderedQuantity - actualCompletedQuantity
    : 0;

  // Allow 10% over the ordered quantity for input validation
  const maxAllowedQuantity = selectedDetail
    ? Math.floor(selectedDetail.orderedQuantity * 1.1) // 110% of ordered quantity
    : 0;

  const remainingQuantity = selectedDetail
    ? maxAllowedQuantity - actualCompletedQuantity
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-2xl">
            {/* Beautiful Header with Gradient */}
            <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-white/20 p-3">
                      <Package className="size-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">
                        {isEditing ? '✏️ Cập nhật phiếu nhập' : '📦 Tạo phiếu nhập mới'}
                      </h1>
                      <p className="mt-1 text-blue-100">
                        {isEditing ? 'Cập nhật thông tin phiếu nhập' : 'Tạo phiếu nhập cho đơn gia công'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                    >
                      ✕ Hủy
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="bg-white font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? '⏳ Đang lưu...'
                        : (isEditing ? '💾 Cập nhật' : '✨ Tạo mới')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Order Info Card */}
              {selectedDetail && (
                <div className="border-b border-amber-200 bg-amber-50 px-8 py-6">
                  <div className="mb-3 flex items-center space-x-3">
                    <CheckCircle className="size-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-800">Thông tin đơn hàng</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                      <div className="font-medium text-amber-600">Kế hoạch</div>
                      <div className="font-semibold text-gray-800">{selectedDetail.planCode}</div>
                      <div className="text-xs text-gray-500">{selectedDetail.planName}</div>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                      <div className="font-medium text-amber-600">Sản phẩm</div>
                      <div className="font-semibold text-gray-800">{selectedDetail.productCode}</div>
                      <div className="text-xs text-gray-500">{selectedDetail.productName}</div>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                      <div className="font-medium text-amber-600">Công đoạn</div>
                      <div className="font-semibold text-gray-800">{selectedDetail.stepCode}</div>
                      <div className="text-xs text-gray-500">{selectedDetail.stepName}</div>
                    </div>
                  </div>

                  {/* Quantity Summary */}
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                    <div className="flex space-x-6">
                      <div>
                        <span className="text-xs text-gray-500">Đã đặt</span>
                        <div className="font-bold text-blue-600">{selectedDetail.orderedQuantity}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Đã nhập</span>
                        <div className="font-bold text-green-600">{actualCompletedQuantity}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Còn lại</span>
                        <div className="font-bold text-orange-600">{displayRemainingQuantity}</div>
                      </div>
                    </div>
                    {remainingQuantity > 0
                      ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="mr-1 size-4" />
                            <span className="text-sm font-medium">Có thể nhập</span>
                          </div>
                        )
                      : (
                          <div className="flex items-center text-amber-600">
                            <AlertCircle className="mr-1 size-4" />
                            <span className="text-sm font-medium">Đã đủ</span>
                          </div>
                        )}
                  </div>

                  {/* Existing Receipts */}
                  {existingReceipts.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-3 flex items-center space-x-2">
                        <Package className="size-4 text-amber-600" />
                        <h4 className="font-medium text-amber-800">
                          Lịch sử nhập hàng (
                          {existingReceipts.length}
                          {' '}
                          lần)
                        </h4>
                      </div>
                      <div className="rounded-lg bg-white p-3 shadow-sm">
                        <div className="max-h-32 space-y-2 overflow-y-auto">
                          {existingReceipts.map((receipt, index) => (
                            <div key={receipt.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-3">
                                <span className="flex size-6 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-600">
                                  {index + 1}
                                </span>
                                <span className="text-gray-600">{receipt.receiptNumber}</span>
                                <span className="text-xs text-gray-400">
                                  {receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString('vi-VN') : ''}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-green-600">
                                  +
                                  {receipt.receiptQuantity}
                                </span>
                                <span className="text-xs text-gray-400">đv</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2">
                          <span className="text-sm font-medium text-gray-700">Tổng đã nhập:</span>
                          <span className="font-bold text-green-600">
                            {actualCompletedQuantity}
                            {' '}
                            đơn vị
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-8 px-8 py-6">
                {/* Receipt Quantity - Beautiful Card */}
                <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                  <FormField
                    control={form.control}
                    name="receiptQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <div className="mb-4 flex items-center space-x-3">
                          <div className="rounded-full bg-green-100 p-2">
                            <Package className="size-5 text-green-600" />
                          </div>
                          <FormLabel className="text-lg font-semibold text-green-800">
                            📦 Số lượng nhập *
                          </FormLabel>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              max={remainingQuantity || undefined}
                              placeholder="Nhập số lượng đã nhận"
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                              className="h-14 rounded-xl border-2 border-green-300 bg-white pl-4 pr-16 text-lg font-semibold [appearance:textfield] focus:border-green-500 focus:ring-green-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-green-600">
                              đơn vị
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                        {remainingQuantity > 0 && (
                          <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">
                            <div className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="size-4 text-green-500" />
                              <span className="text-green-700">
                                Số lượng tối đa có thể nhập:
                                <span className="ml-1 font-bold text-green-800">
                                  {remainingQuantity}
                                  {' '}
                                  đơn vị
                                </span>
                                <span className="ml-1 text-xs">(cho phép nhập thêm 10%)</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes - Beautiful Card */}
                <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <div className="mb-4 flex items-center space-x-3">
                          <div className="rounded-full bg-purple-100 p-2">
                            <FileText className="size-5 text-purple-600" />
                          </div>
                          <FormLabel className="text-lg font-semibold text-purple-800">
                            📝 Ghi chú bổ sung
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="💭 Nhập ghi chú về chất lượng, tình trạng hàng hóa, hoặc thông tin bổ sung khác..."
                            className="min-h-[120px] resize-none rounded-xl border-2 border-purple-300 bg-white text-base focus:border-purple-500 focus:ring-purple-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="mt-2 flex items-center space-x-1 text-xs text-purple-600">
                          <span>💡</span>
                          <span>Ghi chú giúp theo dõi và quản lý chất lượng hàng hóa tốt hơn</span>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
