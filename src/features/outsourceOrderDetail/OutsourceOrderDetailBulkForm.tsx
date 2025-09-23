/**
 * OutsourceOrderDetail Bulk Form Component
 * Allows selecting multiple production steps with quantities at once
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Minus, Plus, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateOutsourceOrderDetailBulk } from '@/hooks/useOutsourceOrderDetailMutations';
import { useOutsourceOrderDetailRelationOptions } from '@/hooks/useOutsourceOrderDetails';

// Form schema for bulk creation
const bulkFormSchema = z.object({
  outsourceOrderId: z.number(),
  planId: z.number().min(1, 'Plan is required'),
  productId: z.number().min(1, 'Product is required'),
  locationCode: z.string().optional(),
  productSubCode: z.string().optional(),
  expectedCompletionDate: z.string().min(1, 'Expected completion date is required'),
  selectedSteps: z.array(z.object({
    productionStepId: z.number(),
    orderedQuantity: z.number().min(1, 'Quantity must be at least 1'),
    itemNotes: z.string().optional(),
  })).min(1, 'At least one production step must be selected'),
});

type BulkFormData = z.infer<typeof bulkFormSchema>;

type ProductionStepWithSelection = {
  id: number;
  stepCode: string;
  stepName: string;
  selected: boolean;
  orderedQuantity: number;
  itemNotes?: string;
};

type OutsourceOrderDetailBulkFormProps = {
  outsourceOrderId: number;
  onSuccess: () => void;
  onCancel: () => void;
};

export function OutsourceOrderDetailBulkForm({
  outsourceOrderId,
  onSuccess,
  onCancel,
}: OutsourceOrderDetailBulkFormProps) {
  const [selectedPlan, setSelectedPlan] = useState<{ id: number; planCode: string; planName: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; productCode: string; productName: string } | null>(null);
  const [selectedWorkTable, setSelectedWorkTable] = useState<{ locationCode: string; tableName: string } | null>(null);
  const [selectedProductSub, setSelectedProductSub] = useState<{ productSubCode: string; productSubDetail: string; productCode: string } | null>(null);
  const [productionSteps, setProductionSteps] = useState<ProductionStepWithSelection[]>([]);
  const [stepFilter, setStepFilter] = useState('');

  const createBulkMutation = useCreateOutsourceOrderDetailBulk();

  // Get basic options (plans, production steps, product subs) - not dependent on plan/product sub selection
  const { data: basicOptions } = useOutsourceOrderDetailRelationOptions(outsourceOrderId);

  // Get products filtered by selected plan
  const { data: planFilteredOptions, isLoading: isLoadingOptions } = useOutsourceOrderDetailRelationOptions(outsourceOrderId, selectedPlan?.id);

  // Get work tables filtered by selected plan and product sub
  const { data: locationFilteredOptions } = useOutsourceOrderDetailRelationOptions(outsourceOrderId, selectedPlan?.id, selectedProductSub?.productSubCode);

  // Combine options - use appropriate filtered data
  const relationOptions = {
    outsourceOrders: basicOptions?.outsourceOrders || [],
    plans: basicOptions?.plans || [],
    products: planFilteredOptions?.products || [],
    productionSteps: basicOptions?.productionSteps || [],
    workTables: locationFilteredOptions?.workTables || [],
    productSubs: basicOptions?.productSubs || [],
  };

  const t = useTranslations('OrderDetailForm');

  // Default expected date (today + 30 days)
  const today = new Date();
  const defaultExpectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30)
    .toISOString().split('T')[0];

  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      outsourceOrderId,
      planId: 0,
      productId: 0,
      locationCode: '',
      productSubCode: '',
      expectedCompletionDate: defaultExpectedDate,
      selectedSteps: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'selectedSteps',
  });

  // Initialize production steps when options are loaded
  useEffect(() => {
    if (basicOptions?.productionSteps) {
      setProductionSteps(
        basicOptions.productionSteps.map(step => ({
          ...step,
          selected: false,
          orderedQuantity: 1,
        })),
      );
    }
  }, [basicOptions]);

  const handlePlanChange = (planId: string) => {
    const plan = basicOptions?.plans.find(p => p.id === Number(planId));
    if (plan) {
      setSelectedPlan(plan);
      form.setValue('planId', plan.id);

      // Reset product when plan changes since products will be filtered by new plan
      setSelectedProduct(null);
      form.setValue('productId', 0);

      // Also reset product sub since it depends on product
      setSelectedProductSub(null);
      form.setValue('productSubCode', '');
    }
  };

  const handleProductChange = (productId: string) => {
    const product = relationOptions?.products.find(p => p.id === Number(productId));
    if (product) {
      setSelectedProduct(product);
      form.setValue('productId', product.id);

      // Reset product sub and location when product changes
      setSelectedProductSub(null);
      form.setValue('productSubCode', '');
      setSelectedWorkTable(null);
      form.setValue('locationCode', '');
    }
  };

  const handleWorkTableChange = (locationCode: string) => {
    const workTable = relationOptions?.workTables?.find(w => w.locationCode === locationCode);
    if (workTable) {
      setSelectedWorkTable(workTable);
      form.setValue('locationCode', workTable.locationCode);
    }
  };

  const handleProductSubChange = (productSubCode: string) => {
    const productSub = basicOptions?.productSubs?.find(p => p.productSubCode === productSubCode);
    if (productSub) {
      setSelectedProductSub(productSub);
      form.setValue('productSubCode', productSub.productSubCode);

      // Reset location when product sub changes since locations will be filtered by new product sub
      setSelectedWorkTable(null);
      form.setValue('locationCode', '');
    }
  };

  const handleStepToggle = (stepId: number) => {
    setProductionSteps(prev =>
      prev.map(step =>
        step.id === stepId
          ? { ...step, selected: !step.selected }
          : step,
      ),
    );

    const step = productionSteps.find(s => s.id === stepId);
    if (step) {
      if (!step.selected) {
        // Add to selected steps
        append({
          productionStepId: stepId,
          orderedQuantity: step.orderedQuantity,
          itemNotes: step.itemNotes,
        });
      } else {
        // Remove from selected steps
        const index = fields.findIndex(field => field.productionStepId === stepId);
        if (index >= 0) {
          remove(index);
        }
      }
    }
  };

  const handleQuantityChange = (stepId: number, quantity: number) => {
    setProductionSteps(prev =>
      prev.map(step =>
        step.id === stepId
          ? { ...step, orderedQuantity: quantity }
          : step,
      ),
    );

    // Update form field
    const fieldIndex = fields.findIndex(field => field.productionStepId === stepId);
    if (fieldIndex >= 0) {
      form.setValue(`selectedSteps.${fieldIndex}.orderedQuantity`, quantity);
    }
  };

  const handleNotesChange = (stepId: number, notes: string) => {
    setProductionSteps(prev =>
      prev.map(step =>
        step.id === stepId
          ? { ...step, itemNotes: notes }
          : step,
      ),
    );

    // Update form field
    const fieldIndex = fields.findIndex(field => field.productionStepId === stepId);
    if (fieldIndex >= 0) {
      form.setValue(`selectedSteps.${fieldIndex}.itemNotes`, notes);
    }
  };

  const onSubmit = async (data: BulkFormData) => {
    try {
      // Prepare bulk creation data
      const bulkData = data.selectedSteps.map((step) => {
        const stepInfo = productionSteps.find(s => s.id === step.productionStepId);
        return {
          outsourceOrderId: data.outsourceOrderId,
          planId: data.planId,
          productId: data.productId,
          productionStepId: step.productionStepId,
          planCode: selectedPlan?.planCode || '',
          planName: selectedPlan?.planName || '',
          productCode: selectedProduct?.productCode || '',
          productName: selectedProduct?.productName || '',
          stepCode: stepInfo?.stepCode || '',
          stepName: stepInfo?.stepName || '',
          locationCode: data.locationCode,
          productSubCode: data.productSubCode,
          orderedQuantity: step.orderedQuantity,
          expectedCompletionDate: new Date(data.expectedCompletionDate),
          itemNotes: step.itemNotes,
          status: 'pending',
        };
      });

      await createBulkMutation.mutateAsync(bulkData);
      onSuccess();
    } catch (error) {
      console.error('Bulk form submission error:', error);
    }
  };

  // Filter production steps based on search
  const filteredProductionSteps = productionSteps.filter((step) => {
    if (!stepFilter) {
      return true;
    }
    const searchTerm = stepFilter.toLowerCase();
    return (
      step.stepCode.toLowerCase().includes(searchTerm)
      || step.stepName.toLowerCase().includes(searchTerm)
    );
  });

  const selectedStepsCount = productionSteps.filter(step => step.selected).length;
  const totalQuantity = productionSteps
    .filter(step => step.selected)
    .reduce((sum, step) => sum + step.orderedQuantity, 0);

  const isLoading = createBulkMutation.isPending;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">
          {t('bulk_add_title')}
        </h2>
        <p className="text-sm text-gray-600">
          {t('bulk_add_description')}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Plan Selection */}
          <FormField
            control={form.control}
            name="planId"
            render={() => (
              <FormItem className="flex flex-row items-center gap-x-2">
                <FormLabel className="min-w-[120px]">
                  {t('plan')}
                  {' '}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={handlePlanChange}
                  value={selectedPlan?.id.toString() || ''}
                  disabled={isLoadingOptions}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_plan')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationOptions?.plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.planCode}
                        {' '}
                        -
                        {plan.planName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Product Selection */}
          <FormField
            control={form.control}
            name="productId"
            render={() => (
              <FormItem className="flex flex-row items-center gap-x-2">
                <FormLabel className="min-w-[120px]">
                  {t('product')}
                  {' '}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <Select
                  onValueChange={handleProductChange}
                  value={selectedProduct?.id.toString() || ''}
                  disabled={!selectedPlan}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedPlan ? t('select_product') : t('select_plan_first')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationOptions?.products.map(product => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.productCode}
                        {' '}
                        -
                        {product.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Product Sub Selection */}
          <FormField
            control={form.control}
            name="productSubCode"
            render={() => (
              <FormItem className="flex flex-row items-center gap-x-2">
                <FormLabel className="min-w-[120px]">
                  {t('product_sub')}
                </FormLabel>
                <Select
                  onValueChange={handleProductSubChange}
                  value={selectedProductSub?.productSubCode || ''}
                  disabled={!selectedProduct}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_product_sub')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationOptions?.productSubs
                      ?.filter(ps => !selectedProduct || ps.productCode === selectedProduct.productCode)
                      ?.map(productSub => (
                        <SelectItem key={productSub.productSubCode} value={productSub.productSubCode}>
                          {productSub.productSubDetail}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location Selection */}
          <FormField
            control={form.control}
            name="locationCode"
            render={() => (
              <FormItem className="flex flex-row items-center gap-x-2">
                <FormLabel className="min-w-[120px]">
                  {t('location')}
                </FormLabel>
                <Select
                  onValueChange={handleWorkTableChange}
                  value={selectedWorkTable?.locationCode || ''}
                  disabled={!selectedProductSub}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedProductSub ? t('select_location') : t('select_product_sub_first')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationOptions?.workTables?.map(workTable => (
                      <SelectItem key={workTable.locationCode} value={workTable.locationCode}>
                        {workTable.tableName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expected Completion Date - Hidden but still functional */}
          <FormField
            control={form.control}
            name="expectedCompletionDate"
            render={({ field }) => (
              <FormItem className="hidden">
                <FormLabel className="min-w-[120px]">
                  {t('expected_completion_date')}
                  {' '}
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Production Steps Selection Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t('select_production_steps')}
                {' '}
                <span className="text-red-500">*</span>
              </h3>
              <div className="text-sm text-gray-600">
                {selectedStepsCount}
                {' '}
                {t('steps_selected')}
                {' '}
                •
                {' '}
                {totalQuantity}
                {' '}
                {t('total_quantity')}
              </div>
            </div>

            {/* Search/Filter Bar with Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t('search_production_steps')}
                  value={stepFilter}
                  onChange={e => setStepFilter(e.target.value)}
                  className="px-10"
                />
                {stepFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 size-6 -translate-y-1/2 p-0"
                    onClick={() => setStepFilter('')}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {filteredProductionSteps.length}
                {' '}
                /
                {productionSteps.length}
                {' '}
                {t('production_steps')}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {createBulkMutation.error && (
                  <div className="text-sm text-red-500">
                    Error:
                    {' '}
                    {createBulkMutation.error.message}
                  </div>
                )}

                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} size="sm">
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || selectedStepsCount === 0 || !form.formState.isValid}
                  size="sm"
                >
                  {isLoading
                    ? t('creating_bulk')
                    : `${t('create')} ${selectedStepsCount} ${t('items')}`}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredProductionSteps.length > 0 && filteredProductionSteps.every(step => step.selected)}
                        onCheckedChange={(checked) => {
                          filteredProductionSteps.forEach((step) => {
                            if (checked !== step.selected) {
                              handleStepToggle(step.id);
                            }
                          });
                        }}
                      />
                    </TableHead>
                    <TableHead>{t('production_step')}</TableHead>
                    <TableHead className="w-32">{t('quantity')}</TableHead>
                    <TableHead className="w-48">{t('notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProductionSteps.map(step => (
                    <TableRow
                      key={step.id}
                      className={step.selected ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={step.selected}
                          onCheckedChange={() => handleStepToggle(step.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{step.stepCode}</div>
                        <div className="text-xs text-gray-500">{step.stepName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="size-8 p-0"
                            disabled={!step.selected}
                            onClick={() => handleQuantityChange(step.id, Math.max(1, step.orderedQuantity - 1))}
                          >
                            <Minus className="size-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={step.orderedQuantity}
                            onChange={e => handleQuantityChange(step.id, Math.max(1, Number(e.target.value) || 1))}
                            className="mx-1 h-8 w-16 text-center"
                            disabled={!step.selected}
                            placeholder={t('ordered_quantity_placeholder')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="size-8 p-0"
                            disabled={!step.selected}
                            onClick={() => handleQuantityChange(step.id, step.orderedQuantity + 1)}
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={step.itemNotes || ''}
                          onChange={e => handleNotesChange(step.id, e.target.value)}
                          className="h-8 min-h-8 resize-none"
                          disabled={!step.selected}
                          placeholder={t('notes_placeholder')}
                          rows={1}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Empty state for filtered results */}
              {filteredProductionSteps.length === 0 && productionSteps.length > 0 && (
                <div className="py-8 text-center text-gray-500">
                  <p className="text-sm">{t('no_production_steps_found')}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStepFilter('')}
                    className="mt-2"
                  >
                    {t('clear_filter')}
                  </Button>
                </div>
              )}
            </div>

            {selectedStepsCount === 0 && (
              <p className="text-sm text-red-500">{t('select_at_least_one_step')}</p>
            )}
          </div>

        </form>
      </Form>
    </div>
  );
}
