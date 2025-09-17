/**
 * OutsourceOrder Bulk Form Component
 * Step-by-step workflow for creating outsource orders with details
 * Based on EmployeeSalaryEntryBulkForm pattern with OutsourceOrder business logic
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCreateOutsourceOrderWithDetails } from '@/hooks/useOutsourceOrderMutations';
import {
  useOutsourceOrderFilteredLocations,
  useOutsourceOrderFilteredProducts,
  useOutsourceOrderFilteredProductSubs,
  useOutsourceOrderProductionSteps,
  useOutsourceOrderRelationOptions,
} from '@/hooks/useOutsourceOrders';
import {
  outsourceOrderBulkFormSchema,
  outsourceOrderBulkValidationRules,
} from '@/libs/validations/outsourceOrder';
import type {
  OutsourceOrderBulkFormData,
  OutsourceOrderProductionStepOption,
} from '@/types/outsourceOrder';
import { cn } from '@/utils/Helpers';

type ProductionStepWithSelection = OutsourceOrderProductionStepOption & {
  selected: boolean;
  orderedQuantity: number;
  expectedCompletionDate: Date;
  itemNotes?: string;
  unitPrice?: number;
  validationStatus?: 'valid' | 'invalid' | 'pending';
  validationMessage?: string;
};

type OutsourceOrderBulkFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function OutsourceOrderBulkForm({
  onSuccess,
  onCancel,
}: OutsourceOrderBulkFormProps) {
  // Local state for selections
  const [selectedPlan, setSelectedPlan] = useState<{ id: number; planCode: string; planName: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; productCode: string; productName: string } | null>(null);
  const [selectedProductSub, setSelectedProductSub] = useState<{ code: string; name: string } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ code: string; name: string } | null>(null);

  // Production steps with selection state
  const [productionSteps, setProductionSteps] = useState<ProductionStepWithSelection[]>([]);
  const [stepFilter, setStepFilter] = useState('');

  // Hooks for data fetching
  const { data: relationOptions } = useOutsourceOrderRelationOptions();
  const { data: filteredProducts } = useOutsourceOrderFilteredProducts(selectedPlan?.id || null);
  const { data: filteredProductSubs } = useOutsourceOrderFilteredProductSubs(selectedProduct?.id || null);
  const { data: filteredLocations } = useOutsourceOrderFilteredLocations(selectedProductSub?.code || null);
  const { data: availableProductionSteps } = useOutsourceOrderProductionSteps();

  // Mutation for creation
  const createWithDetailsMutation = useCreateOutsourceOrderWithDetails();

  // Default values
  const defaultOrderDate = new Date();
  const defaultExpectedCompletion = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 1 week from today
    return date;
  }, []);

  const form = useForm<OutsourceOrderBulkFormData>({
    resolver: zodResolver(outsourceOrderBulkFormSchema),
    defaultValues: {
      assignedToUserId: '',
      orderDate: defaultOrderDate,
      applyRetailPrice: 2, // Normal price
      priority: 5,
      expectedCompletionDate: defaultExpectedCompletion,
      planId: 0,
      productId: 0,
      selectedSteps: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'selectedSteps',
  });

  // Update production steps when available steps change
  useEffect(() => {
    if (availableProductionSteps && Array.isArray(availableProductionSteps)) {
      const steps = availableProductionSteps.map((step: OutsourceOrderProductionStepOption) => ({
        ...step,
        selected: false,
        orderedQuantity: 1,
        expectedCompletionDate: defaultExpectedCompletion,
        itemNotes: '',
        unitPrice: 0,
        validationStatus: 'pending' as const,
      }));
      setProductionSteps(steps);
    } else {
      setProductionSteps([]);
    }
  }, [availableProductionSteps, defaultExpectedCompletion]);

  // Reset dependent selections when parent changes
  useEffect(() => {
    if (!selectedPlan) {
      setSelectedProduct(null);
      setSelectedProductSub(null);
      setSelectedLocation(null);
      form.setValue('productId', 0);
    }
  }, [selectedPlan, form]);

  useEffect(() => {
    if (!selectedProduct) {
      setSelectedProductSub(null);
      setSelectedLocation(null);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProductSub) {
      setSelectedLocation(null);
    }
  }, [selectedProductSub]);

  // Handle plan selection
  const handlePlanChange = (planId: string) => {
    const plan = relationOptions?.plans.find((p: { id: number; planCode: string; planName: string }) => p.id === Number(planId));
    if (plan) {
      setSelectedPlan(plan);
      form.setValue('planId', plan.id);
    }
  };

  // Handle product selection
  const handleProductChange = (productId: string) => {
    const product = filteredProducts?.find((p: { id: number; productCode: string; productName: string }) => p.id === Number(productId));
    if (product) {
      setSelectedProduct(product);
      form.setValue('productId', product.id);
    }
  };

  // Handle product sub selection
  const handleProductSubChange = (productSubCode: string) => {
    const productSub = filteredProductSubs?.find((ps: { code: string; name: string }) => ps.code === productSubCode);
    if (productSub) {
      setSelectedProductSub(productSub);
      form.setValue('productSubCode', productSubCode);
    }
  };

  // Handle location selection
  const handleLocationChange = (locationCode: string) => {
    const location = filteredLocations?.find((l: { code: string; name: string }) => l.code === locationCode);
    if (location) {
      setSelectedLocation(location);
      form.setValue('locationCode', locationCode);
    }
  };

  // Validate quantity (placeholder for business rules)
  const validateStepQuantity = useCallback(async (stepId: number, quantity: number) => {
    if (!selectedPlan || !selectedProduct) {
      return { valid: false, message: 'Please select plan and product first' };
    }

    const validation = outsourceOrderBulkValidationRules.validateQuantityLimits(stepId, quantity, {
      plan: selectedPlan,
      product: selectedProduct,
    });

    return validation;
  }, [selectedPlan, selectedProduct]);

  // Handle step selection toggle
  const handleStepToggle = async (stepId: number) => {
    const stepIndex = productionSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      return;
    }

    const step = productionSteps[stepIndex];
    if (!step) {
      return;
    }

    const newSelected = !step.selected;

    // Update step selection
    const updatedSteps = [...productionSteps];
    updatedSteps[stepIndex] = { ...step, selected: newSelected };
    setProductionSteps(updatedSteps);

    if (newSelected) {
      // Add to selected steps
      append({
        productionStepId: stepId,
        orderedQuantity: step.orderedQuantity,
        expectedCompletionDate: step.expectedCompletionDate,
        itemNotes: step.itemNotes,
        unitPrice: step.unitPrice,
      });

      // Validate quantity
      const validation = await validateStepQuantity(stepId, step.orderedQuantity);
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        validationStatus: validation.valid ? 'valid' : 'invalid',
        validationMessage: validation.message,
      };
      setProductionSteps(updatedSteps);
    } else {
      // Remove from selected steps
      const fieldIndex = fields.findIndex(field => field.productionStepId === stepId);
      if (fieldIndex >= 0) {
        remove(fieldIndex);
      }
    }
  };

  // Handle quantity change
  const handleQuantityChange = (stepId: number, quantity: number) => {
    const stepIndex = productionSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      return;
    }

    const currentStep = productionSteps[stepIndex];
    if (!currentStep) {
      return;
    }

    // Update step quantity
    const updatedSteps = [...productionSteps];
    updatedSteps[stepIndex] = { ...currentStep, orderedQuantity: quantity };
    setProductionSteps(updatedSteps);

    // Update form field
    const fieldIndex = fields.findIndex(field => field.productionStepId === stepId);
    if (fieldIndex >= 0) {
      form.setValue(`selectedSteps.${fieldIndex}.orderedQuantity`, quantity);
    }
  };

  // Handle quantity blur (validation)
  const handleQuantityBlur = async (stepId: number, quantity: number) => {
    const stepIndex = productionSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      return;
    }

    const currentStep = productionSteps[stepIndex];
    if (!currentStep || !currentStep.selected) {
      return;
    }

    const validation = await validateStepQuantity(stepId, quantity);
    const updatedSteps = [...productionSteps];
    updatedSteps[stepIndex] = {
      ...currentStep,
      validationStatus: validation.valid ? 'valid' : 'invalid',
      validationMessage: validation.message,
    };
    setProductionSteps(updatedSteps);
  };

  // Handle notes change
  const handleNotesChange = (stepId: number, notes: string) => {
    const stepIndex = productionSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) {
      return;
    }

    const currentStep = productionSteps[stepIndex];
    if (!currentStep) {
      return;
    }

    // Update step notes
    const updatedSteps = [...productionSteps];
    updatedSteps[stepIndex] = { ...currentStep, itemNotes: notes };
    setProductionSteps(updatedSteps);

    // Update form field
    const fieldIndex = fields.findIndex(field => field.productionStepId === stepId);
    if (fieldIndex >= 0) {
      form.setValue(`selectedSteps.${fieldIndex}.itemNotes`, notes);
    }
  };

  // Form submission
  const onSubmit = async (data: OutsourceOrderBulkFormData) => {
    try {
      // Generate order code
      const orderCode = `OS${Date.now()}`; // TODO: Implement proper order code generation

      // Prepare bulk creation payload
      const payload = {
        orderCode,
        assignedToUserId: data.assignedToUserId,
        orderDate: data.orderDate,
        applyRetailPrice: data.applyRetailPrice,
        orderTitle: data.orderTitle,
        priority: data.priority,
        expectedCompletionDate: data.expectedCompletionDate,
        notes: data.notes,
        status: 'draft' as const,
        details: data.selectedSteps.map(step => ({
          planId: data.planId,
          productId: data.productId,
          productionStepId: step.productionStepId,
          orderedQuantity: step.orderedQuantity,
          expectedCompletionDate: step.expectedCompletionDate,
          itemNotes: step.itemNotes,
          unitPrice: step.unitPrice,
          locationCode: data.locationCode,
          productSubCode: data.productSubCode,
        })),
      };

      await createWithDetailsMutation.mutateAsync(payload);
      onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Filter production steps based on search
  const filteredProductionSteps = productionSteps.filter((step) => {
    if (!stepFilter) {
      return true;
    }
    const searchTerm = stepFilter.toLowerCase();
    return (
      step.stepName?.toLowerCase().includes(searchTerm)
      || step.stepCode?.toLowerCase().includes(searchTerm)
    );
  });

  const selectedStepsCount = productionSteps.filter(step => step.selected).length;
  const invalidStepsCount = productionSteps.filter(step => step.selected && step.validationStatus === 'invalid').length;

  // Check if can proceed to step 2
  const canProceedToStep2 = outsourceOrderBulkValidationRules.canProceedToStep2(form.getValues());

  // Loading and mutation states
  const isSubmitting = createWithDetailsMutation.isPending;

  return (
    <div className="max-h-[90vh] overflow-auto bg-gray-50 p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tabs Container */}
          <Tabs defaultValue="order-header" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="order-header" className="flex items-center gap-2 text-base font-medium">
                📋 Tạo OutsourceOrder
              </TabsTrigger>
              <TabsTrigger
                value="order-details"
                className={cn(
                  'flex items-center gap-2 text-base font-medium',
                  !canProceedToStep2 && 'text-gray-400',
                )}
                disabled={!canProceedToStep2}
              >
                📦 Chọn Chi Tiết
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: OutsourceOrder Header */}
            <TabsContent value="order-header" className="space-y-6">
              <div className="overflow-hidden rounded-xl border-2 border-blue-200 bg-white shadow-lg">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                  <h3 className="text-lg font-bold text-white">📋 Thông Tin OutsourceOrder</h3>
                </div>
                <div className="space-y-4 p-6">
                  {/* Required Fields */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Assigned To */}
                    <FormField
                      control={form.control}
                      name="assignedToUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-blue-800">
                            👤 Giao Cho *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-blue-300">
                                <SelectValue placeholder="Chọn người được giao..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relationOptions?.userSyncs
                                ?.filter((user: { id: string; fullName: string }) => user.id && user.id.trim() !== '')
                                ?.map((user: { id: string; fullName: string }) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.fullName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Order Date */}
                    <FormField
                      control={form.control}
                      name="orderDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-blue-800">
                            📅 Ngày Đặt Hàng *
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'h-12 w-full border-2 border-blue-300 text-left font-normal',
                                    !field.value && 'text-muted-foreground',
                                  )}
                                >
                                  {field.value
                                    ? (
                                        field.value.toLocaleDateString('vi-VN')
                                      )
                                    : (
                                        <span>Chọn ngày...</span>
                                      )}
                                  <CalendarIcon className="ml-auto size-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={date => date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Apply Retail Price */}
                  <FormField
                    control={form.control}
                    name="applyRetailPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-blue-800">
                          💰 Áp Dụng Giá
                        </FormLabel>
                        <Select
                          onValueChange={value => field.onChange(Number(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 border-2 border-blue-300">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2">Giá Thường (Normal Price)</SelectItem>
                            <SelectItem value="3">Giá Lẻ (Retail Price)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Optional Fields - Collapsible */}
                  <details className="rounded-lg border border-blue-200">
                    <summary className="cursor-pointer bg-blue-50 p-3 font-medium text-blue-800">
                      ⚙️ Thông Tin Bổ Sung (Tùy Chọn)
                    </summary>
                    <div className="space-y-4 p-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Order Title */}
                        <FormField
                          control={form.control}
                          name="orderTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>📝 Tiêu Đề Đơn Hàng</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nhập tiêu đề..." className="h-12 border-2" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Priority */}
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>🔥 Độ Ưu Tiên (1-10)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  {...field}
                                  onChange={e => field.onChange(Number(e.target.value))}
                                  className="h-12 border-2"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Expected Completion Date */}
                        <FormField
                          control={form.control}
                          name="expectedCompletionDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>⏰ Ngày Hoàn Thành Dự Kiến</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        'h-12 w-full border-2 text-left font-normal',
                                        !field.value && 'text-muted-foreground',
                                      )}
                                    >
                                      {field.value
                                        ? (
                                            field.value.toLocaleDateString('vi-VN')
                                          )
                                        : (
                                            <span>Chọn ngày...</span>
                                          )}
                                      <CalendarIcon className="ml-auto size-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={date => date < new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
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
                            <FormLabel>📋 Ghi Chú</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} placeholder="Nhập ghi chú..." className="border-2" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </details>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Order Details Selection */}
            <TabsContent value="order-details" className="space-y-6">
              <div className="overflow-hidden rounded-xl border-2 border-green-200 bg-white shadow-lg">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
                  <h3 className="text-lg font-bold text-white">📦 Chi Tiết Đơn Hàng</h3>
                </div>
                <div className="space-y-6 p-6">
                  {/* Dependency Chain */}
                  <div className="space-y-4">
                    {/* Plan Selection */}
                    <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-4">
                      <FormField
                        control={form.control}
                        name="planId"
                        render={() => (
                          <FormItem>
                            <FormLabel className="text-lg font-bold text-orange-800">
                              📊 Chọn Kế Hoạch *
                            </FormLabel>
                            <Select onValueChange={handlePlanChange} value={selectedPlan?.id.toString() || ''}>
                              <FormControl>
                                <SelectTrigger className="h-12 border-2 border-orange-300 text-lg">
                                  <SelectValue placeholder="👆 Click to select plan..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {relationOptions?.plans
                                  ?.filter((plan: { id: number; planCode: string; planName: string }) => plan.id && plan.planCode && plan.planCode.trim() !== '')
                                  ?.map((plan: { id: number; planCode: string; planName: string }) => (
                                    <SelectItem key={plan.id} value={plan.id.toString()}>
                                      {plan.planName}
                                      {' '}
                                      (
                                      {plan.planCode}
                                      )
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Product Selection */}
                    <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
                      <FormField
                        control={form.control}
                        name="productId"
                        render={() => (
                          <FormItem>
                            <FormLabel className="text-lg font-bold text-green-800">
                              📦 Chọn Sản Phẩm *
                            </FormLabel>
                            <Select
                              onValueChange={handleProductChange}
                              value={selectedProduct?.id.toString() || ''}
                              disabled={!selectedPlan}
                            >
                              <FormControl>
                                <SelectTrigger className={cn(
                                  'h-12 border-2 text-lg',
                                  !selectedPlan
                                    ? 'border-gray-300 bg-gray-100'
                                    : 'border-green-300',
                                )}
                                >
                                  <SelectValue placeholder={
                                    !selectedPlan
                                      ? '⚠️ Select plan first...'
                                      : '👆 Click to select product...'
                                  }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredProducts
                                  ?.filter((product: { id: number; productCode: string; productName: string }) => product.id && product.productCode && product.productCode.trim() !== '')
                                  ?.map((product: { id: number; productCode: string; productName: string }) => (
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Product Sub Selection (Optional) */}
                    <div className="rounded-lg border-2 border-purple-300 bg-purple-50 p-4">
                      <FormField
                        control={form.control}
                        name="productSubCode"
                        render={() => (
                          <FormItem>
                            <FormLabel className="text-lg font-bold text-purple-800">
                              📦 Chọn Product Sub (Tùy Chọn)
                            </FormLabel>
                            <Select
                              onValueChange={handleProductSubChange}
                              value={selectedProductSub?.code || ''}
                              disabled={!selectedProduct}
                            >
                              <FormControl>
                                <SelectTrigger className={cn(
                                  'h-12 border-2 text-lg',
                                  !selectedProduct
                                    ? 'border-gray-300 bg-gray-100'
                                    : 'border-purple-300',
                                )}
                                >
                                  <SelectValue placeholder={
                                    !selectedProduct
                                      ? 'Select product first...'
                                      : 'Select product sub...'
                                  }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredProductSubs
                                  ?.filter((productSub: { code: string; name: string }) => productSub.code && productSub.code.trim() !== '')
                                  ?.map((productSub: { code: string; name: string }) => (
                                    <SelectItem key={productSub.code} value={productSub.code}>
                                      {productSub.name}
                                      {' '}
                                      (
                                      {productSub.code}
                                      )
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Location Selection (Optional) */}
                    <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
                      <FormField
                        control={form.control}
                        name="locationCode"
                        render={() => (
                          <FormItem>
                            <FormLabel className="text-lg font-bold text-blue-800">
                              🏭 Chọn Vị Trí (Tùy Chọn)
                            </FormLabel>
                            <Select
                              onValueChange={handleLocationChange}
                              value={selectedLocation?.code || ''}
                              disabled={!selectedProductSub && filteredProductSubs && filteredProductSubs.length > 0}
                            >
                              <FormControl>
                                <SelectTrigger className={cn(
                                  'h-12 border-2 text-lg',
                                  (!selectedProductSub && filteredProductSubs && filteredProductSubs.length > 0)
                                    ? 'border-gray-300 bg-gray-100'
                                    : 'border-blue-300',
                                )}
                                >
                                  <SelectValue placeholder={
                                    (!selectedProductSub && filteredProductSubs && filteredProductSubs.length > 0)
                                      ? 'Select product sub first...'
                                      : 'Select location...'
                                  }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredLocations
                                  ?.filter((location: { code: string; name: string }) => location.code && location.code.trim() !== '')
                                  ?.map((location: { code: string; name: string }) => (
                                    <SelectItem key={location.code} value={location.code}>
                                      {location.name}
                                      {' '}
                                      (
                                      {location.code}
                                      )
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

                  {/* Production Steps Selection */}
                  <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
                    <h4 className="mb-4 text-lg font-bold text-yellow-800">
                      ⚙️ Chọn Công Đoạn Sản Xuất *
                    </h4>

                    {/* Search and Actions */}
                    <div className="mb-4 flex gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-yellow-500" />
                        <Input
                          type="text"
                          placeholder="Search production steps by name or code..."
                          value={stepFilter}
                          onChange={e => setStepFilter(e.target.value)}
                          className="h-12 border-2 border-yellow-300 pl-10"
                        />
                        {stepFilter && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 size-8 -translate-y-1/2 p-0"
                            onClick={() => setStepFilter('')}
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-yellow-700">
                        {selectedStepsCount}
                        {' '}
                        steps selected •
                        {productionSteps.reduce((sum, step) => sum + (step.selected ? step.orderedQuantity : 0), 0)}
                        {' '}
                        total quantity
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mb-4 flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="border-2"
                      >
                        ❌ Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || selectedStepsCount === 0 || invalidStepsCount > 0}
                        className="bg-gradient-to-r from-green-500 to-blue-500 font-bold text-white"
                      >
                        {isSubmitting
                          ? (
                              <>
                                ⏳ Creating
                                {selectedStepsCount}
                                {' '}
                                items
                              </>
                            )
                          : (
                              <>
                                💾 Create OutsourceOrder
                                {selectedStepsCount}
                                {' '}
                                items
                              </>
                            )}
                      </Button>
                    </div>

                    {/* Production Steps Table */}
                    <div className="overflow-hidden rounded-lg border-2 border-yellow-300">
                      <div className="bg-yellow-200 p-3">
                        <div className="grid grid-cols-4 gap-4 text-sm font-bold">
                          <div>Production Step</div>
                          <div className="text-center">Quantity</div>
                          <div className="text-center">Notes</div>
                          <div className="text-center">Status</div>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {filteredProductionSteps.map((step, index) => (
                          <div
                            key={step.id}
                            className={cn(
                              'grid grid-cols-4 gap-4 p-4 border-b border-yellow-200 hover:bg-yellow-50',
                              step.selected && 'bg-yellow-100',
                            )}
                          >
                            {/* Step Info */}
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={step.selected}
                                onCheckedChange={() => handleStepToggle(step.id)}
                              />
                              <div>
                                <div className="font-medium">{step.stepName}</div>
                                <div className="text-sm text-gray-500">
                                  {step.stepCode}
                                  {' '}
                                  • #
                                  {index + 1}
                                </div>
                              </div>
                            </div>

                            {/* Quantity */}
                            <div className="flex items-center justify-center">
                              {step.selected
                                ? (
                                    <Input
                                      type="number"
                                      min="1"
                                      value={step.orderedQuantity}
                                      onChange={e => handleQuantityChange(step.id, Number(e.target.value))}
                                      onBlur={e => handleQuantityBlur(step.id, Number(e.target.value))}
                                      className="w-20 border-2 text-center"
                                    />
                                  )
                                : (
                                    <span className="text-sm text-gray-400">Not selected</span>
                                  )}
                            </div>

                            {/* Notes */}
                            <div className="flex items-center">
                              {step.selected
                                ? (
                                    <Textarea
                                      value={step.itemNotes || ''}
                                      onChange={e => handleNotesChange(step.id, e.target.value)}
                                      placeholder="Additional notes..."
                                      rows={2}
                                      className="min-h-10 resize-none border-2"
                                    />
                                  )
                                : (
                                    <span className="text-sm text-gray-400">Not selected</span>
                                  )}
                            </div>

                            {/* Status */}
                            <div className="flex items-center justify-center">
                              {step.selected && step.validationStatus
                                ? (
                                    <div className={cn(
                                      'px-3 py-1 rounded-full text-sm font-medium',
                                      step.validationStatus === 'valid' && 'bg-green-100 text-green-800',
                                      step.validationStatus === 'invalid' && 'bg-red-100 text-red-800',
                                      step.validationStatus === 'pending' && 'bg-yellow-100 text-yellow-800',
                                    )}
                                    >
                                      {step.validationStatus === 'valid' && '✅ '}
                                      {step.validationStatus === 'invalid' && '❌ '}
                                      {step.validationStatus === 'pending' && '⏳ '}
                                      {step.validationMessage}
                                    </div>
                                  )
                                : (
                                    <span className="text-sm text-gray-400">Waiting</span>
                                  )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Empty State */}
                      {filteredProductionSteps.length === 0 && (
                        <div className="p-8 text-center">
                          <div className="mb-2 text-4xl">🔍</div>
                          <p className="text-gray-600">No production steps found</p>
                          <p className="text-sm text-gray-500">Try adjusting your search or selection</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
