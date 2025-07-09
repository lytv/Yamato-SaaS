/**
 * OutsourceOrderReceipt Form Component with Enhanced Features
 * Generated based on existing pattern from OutsourceOrderDetailForm.tsx
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateOutsourceOrderReceipt,
  useUpdateOutsourceOrderReceipt,
} from '@/hooks/useOutsourceOrderReceiptMutations';
import { useOutsourceOrderReceiptRelationOptions } from '@/hooks/useOutsourceOrderReceipts';
import { outsourceOrderReceiptFormSchema } from '@/libs/validations/outsourceOrderReceipt';
import type { OutsourceOrderReceiptFormData, OutsourceOrderReceiptWithRelations } from '@/types/outsourceOrderReceipt';
import { cn } from '@/utils/cn';

type OutsourceOrderReceiptFormProps = {
  outsourceOrderReceipt?: OutsourceOrderReceiptWithRelations;
  outsourceOrderDetailId?: number;
  isEditing: boolean;
  onSuccess: () => void;
  onCancel: () => void;
};

const qualityStatusOptions = [
  { value: 'pending', label: 'Pending Inspection' },
  { value: 'passed', label: 'Quality Passed' },
  { value: 'failed', label: 'Quality Failed' },
  { value: 'partial', label: 'Partial Pass' },
  { value: 'needs_rework', label: 'Needs Rework' },
];

const receiptStatusOptions = [
  { value: 'received', label: 'Received' },
  { value: 'inspecting', label: 'Under Inspection' },
  { value: 'stored', label: 'Stored' },
  { value: 'processed', label: 'Processed' },
  { value: 'rejected', label: 'Rejected' },
];

export function OutsourceOrderReceiptForm({
  outsourceOrderReceipt,
  outsourceOrderDetailId,
  isEditing,
  onSuccess,
  onCancel,
}: OutsourceOrderReceiptFormProps) {
  const { data: relationOptions, isLoading: isLoadingOptions } = useOutsourceOrderReceiptRelationOptions(outsourceOrderDetailId);
  const createMutation = useCreateOutsourceOrderReceipt();
  const updateMutation = useUpdateOutsourceOrderReceipt();
  const t = useTranslations('OutsourceOrderReceiptForm');

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
      receivedByUserId: outsourceOrderReceipt?.receivedByUserId || '',
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

  // Auto-generate receipt number if creating new
  useEffect(() => {
    if (!isEditing && !form.getValues('receiptNumber')) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
      form.setValue('receiptNumber', `REC${timestamp}`);
    }
  }, [isEditing, form]);

  // Auto-calculate total cost when quantity or unit cost changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      const { receiptQuantity, actualUnitCost } = values;
      if (receiptQuantity && actualUnitCost) {
        const total = receiptQuantity * actualUnitCost;
        form.setValue('totalCost', total);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: OutsourceOrderReceiptFormData) => {
    try {
      // Đảm bảo receiptDate và plannedReceiptDate là Date
      const receiptDate = typeof data.receiptDate === 'string' ? new Date(data.receiptDate) : data.receiptDate;
      const plannedReceiptDate = data.plannedReceiptDate ? (typeof data.plannedReceiptDate === 'string' ? new Date(data.plannedReceiptDate) : data.plannedReceiptDate) : undefined;
      // Convert 'none' to undefined for inspectedByUserId and deliveredByUserId
      const inspectedByUserId = data.inspectedByUserId === 'none' ? undefined : data.inspectedByUserId;
      const deliveredByUserId = data.deliveredByUserId === 'none' ? undefined : data.deliveredByUserId;
      if (isEditing && outsourceOrderReceipt) {
        await updateMutation.mutateAsync({
          id: outsourceOrderReceipt.id,
          data: {
            ...data,
            inspectedByUserId,
            deliveredByUserId,
            receiptDate,
            plannedReceiptDate,
          },
        });
      } else {
        await createMutation.mutateAsync({
          ...data,
          inspectedByUserId,
          deliveredByUserId,
          receiptDate,
          plannedReceiptDate,
        });
      }
      onSuccess();
    } catch (error) {
      // Error handling is done in mutation hooks
      console.error('Form submission error:', error);
    }
  };

  const selectedDetailId = form.watch('outsourceOrderDetailId');
  const selectedDetail = relationOptions?.outsourceOrderDetails.find(
    detail => detail.id === selectedDetailId,
  );

  const remainingQuantity = selectedDetail
    ? selectedDetail.orderedQuantity - (selectedDetail.completedQuantity || 0)
    : 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">
              {isEditing ? t('edit_title') : t('create_title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isEditing ? t('update') : t('create')}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? t('saving') : (isEditing ? t('update') : t('create'))}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Basic Information Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <h4 className="text-md font-medium text-gray-900">Basic Information</h4>

            {/* Receipt Number */}
            <FormField
              control={form.control}
              name="receiptNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('receipt_number_label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('receipt_number')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Receipt Title */}
            <FormField
              control={form.control}
              name="receiptTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('receipt_title_label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('receipt_title')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order Detail Item */}
            <FormField
              control={form.control}
              name="outsourceOrderDetailId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('order_detail_item_label')}</FormLabel>
                  <Select
                    onValueChange={value => field.onChange(Number(value))}
                    value={field.value?.toString()}
                    disabled={isLoadingOptions || !!outsourceOrderDetailId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('order_detail_item')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {relationOptions?.outsourceOrderDetails.map(detail => (
                        <SelectItem key={detail.id} value={detail.id.toString()}>
                          <div className="flex flex-col">
                            <span>
                              {detail.planCode}
                              {' '}
                              -
                              {' '}
                              {detail.productCode}
                              {' '}
                              -
                              {' '}
                              {detail.stepCode}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {detail.productName}
                              {' '}
                              (
                              {detail.stepName}
                              )
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {selectedDetail && (
                    <div className="text-xs text-muted-foreground">
                      {t('ordered')}
                      :
                      {' '}
                      {selectedDetail.orderedQuantity}
                      ,
                      {' '}
                      {t('completed')}
                      :
                      {' '}
                      {selectedDetail.completedQuantity || 0}
                      ,
                      {t('remaining')}
                      :
                      {' '}
                      <span className="font-medium">{remainingQuantity}</span>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Receipt Date */}
            <FormField
              control={form.control}
              name="receiptDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('receipt_date_label')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? (
                                format(field.value, 'PPP')
                              )
                            : (
                                <span>{t('receipt_date')}</span>
                              )}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value && typeof field.value !== 'string' ? field.value : field.value ? new Date(field.value) : undefined}
                        onSelect={field.onChange}
                        disabled={date =>
                          date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Planned Receipt Date */}
            <FormField
              control={form.control}
              name="plannedReceiptDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('planned_receipt_date_label')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? (
                                format(field.value, 'PPP')
                              )
                            : (
                                <span>{t('planned_receipt_date')}</span>
                              )}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? (typeof field.value === 'string' ? new Date(field.value) : field.value) : undefined}
                        onSelect={field.onChange}
                        disabled={date =>
                          date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Quantity Information Section */}
          <div className="space-y-6">
            <h4 className="text-md font-medium text-gray-900">Quantity Information</h4>

            {/* Receipt Quantity */}
            <FormField
              control={form.control}
              name="receiptQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('receipt_quantity_label')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max={remainingQuantity || undefined}
                      placeholder={t('receipt_quantity')}
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                  {remainingQuantity > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {t('maximum_available')}
                      :
                      {' '}
                      <span className="font-medium">{remainingQuantity}</span>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Defect Quantity */}
            <FormField
              control={form.control}
              name="defectQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('defect_quantity_label')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={t('defect_quantity')}
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rework Quantity */}
            <FormField
              control={form.control}
              name="reworkQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('rework_quantity_label')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder={t('rework_quantity')}
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Good Quantity Display */}
            <div className="rounded-lg bg-green-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">{t('good_quantity')}</span>
                <span className="text-lg font-bold text-green-800">
                  {(form.watch('receiptQuantity') || 0) - (form.watch('defectQuantity') || 0) - (form.watch('reworkQuantity') || 0)}
                </span>
              </div>
              <div className="mt-1 text-xs text-green-600">
                {t('receipt_minus_defects_minus_rework_equals_good_units')}
              </div>
            </div>

            {/* Partial Receipt Toggle */}
            <FormField
              control={form.control}
              name="isPartialReceipt"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('partial_receipt')}</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {t('partial_receipt_description')}
                    </div>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="size-4"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Quality Control Section */}
        <div className="space-y-6">
          <h4 className="text-md font-medium text-gray-900">Quality Control</h4>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Quality Status */}
            <FormField
              control={form.control}
              name="qualityStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('quality_status_label')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('quality_status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {qualityStatusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              option.value === 'passed'
                                ? 'default'
                                : option.value === 'failed'
                                  ? 'destructive'
                                  : option.value === 'partial'
                                    ? 'secondary'
                                    : 'outline'
                            }
                            >
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quality Score */}
            <FormField
              control={form.control}
              name="qualityScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('quality_score_label')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      step="0.1"
                      placeholder={t('quality_score')}
                      {...field}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-muted-foreground">
                    {t('quality_score_description')}
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Quality Notes */}
          <FormField
            control={form.control}
            name="qualityNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('quality_notes_label')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('quality_notes')}
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* People & Workflow Section */}
        <div className="space-y-6">
          <h4 className="text-md font-medium text-gray-900">People & Workflow</h4>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Received By */}
            <FormField
              control={form.control}
              name="receivedByUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('received_by_user_label')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('received_by_user')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {relationOptions?.users.map(user => (
                        <SelectItem key={user.userId} value={user.userId}>
                          {user.fullName || user.userId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Inspected By */}
            <FormField
              control={form.control}
              name="inspectedByUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('inspected_by_user_label')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('inspected_by_user')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('none')}</SelectItem>
                      {relationOptions?.users.map(user => (
                        <SelectItem key={user.userId} value={user.userId}>
                          {user.fullName || user.userId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Delivered By */}
            <FormField
              control={form.control}
              name="deliveredByUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('delivered_by_user_label')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('delivered_by_user')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('none')}</SelectItem>
                      {relationOptions?.users.map(user => (
                        <SelectItem key={user.userId} value={user.userId}>
                          {user.fullName || user.userId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Storage & Location Section */}
        <div className="space-y-6">
          <h4 className="text-md font-medium text-gray-900">Storage & Location</h4>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Batch Number */}
            <FormField
              control={form.control}
              name="batchNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('batch_number_label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('batch_number')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Storage Location */}
            <FormField
              control={form.control}
              name="storageLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('storage_location_label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('storage_location')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warehouse Code */}
            <FormField
              control={form.control}
              name="warehouseCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('warehouse_code_label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('warehouse_code')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Financial Information Section */}
        <div className="space-y-6">
          <h4 className="text-md font-medium text-gray-900">Financial Information</h4>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Actual Unit Cost */}
            <FormField
              control={form.control}
              name="actualUnitCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('actual_unit_cost_label')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={t('actual_unit_cost')}
                      {...field}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-muted-foreground">
                    {t('actual_unit_cost_description')}
                  </div>
                </FormItem>
              )}
            />

            {/* Total Cost (Auto-calculated) */}
            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('total_cost_label')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={t('total_cost')}
                      {...field}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      className="bg-gray-50"
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-muted-foreground">
                    {t('total_cost_description')}
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Cost Summary */}
          {form.watch('actualUnitCost') && form.watch('receiptQuantity') && (
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {t('unit_cost')}
                    :
                    <br />
                    :
                  </span>
                  <div className="font-medium">
                    ₫
                    {form.watch('actualUnitCost')?.toLocaleString('vi-VN')}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t('quantity')}
                    :
                    <br />
                    :
                  </span>
                  <div className="font-medium">{form.watch('receiptQuantity')?.toLocaleString('vi-VN')}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t('total')}
                    :
                    <br />
                    :
                  </span>
                  <div className="font-bold text-blue-600">
                    ₫
                    {((form.watch('actualUnitCost') || 0) * (form.watch('receiptQuantity') || 0)).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Additional Information Section */}
        <div className="space-y-6">
          <h4 className="text-md font-medium text-gray-900">Additional Information</h4>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('receipt_status_label')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('receipt_status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {receiptStatusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <Badge variant={
                            option.value === 'stored' || option.value === 'processed'
                              ? 'default'
                              : option.value === 'rejected'
                                ? 'destructive'
                                : option.value === 'inspecting'
                                  ? 'secondary'
                                  : 'outline'
                          }
                          >
                            {option.label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attachments */}
            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('attachments_label')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('attachments')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-muted-foreground">
                    {t('attachments_description')}
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('notes_label')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('notes')}
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 border-t pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? t('saving') : (isEditing ? t('update') : t('create'))}
          </Button>
        </div>
      </form>
    </Form>
  );
}
