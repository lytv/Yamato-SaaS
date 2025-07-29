/**
 * EmployeeSalaryEntry Bulk Form Component
 * Allows selecting multiple production steps with quantities for salary entries
 * Based on OutsourceOrderDetailBulkForm pattern
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateEmployeeSalaryEntryBulk } from '@/hooks/useCreateEmployeeSalaryEntryBulk';
import { useEmployeeSalaryEntryRelationOptions } from '@/hooks/useEmployeeSalaryEntrys';
import { useProductionStepDetailQuantityLimit } from '@/hooks/useProductionStepDetailQuantityLimit';
import { usePlanDetailPlannedQuantity } from '@/hooks/usePlanDetailPlannedQuantity';
import { useEmployeeSalaryEntryPreviousQuantity } from '@/hooks/useEmployeeSalaryEntryPreviousQuantity';

// Form schema for bulk creation
const bulkSalaryEntryFormSchema = z.object({
  userId: z.string().min(1, 'Employee is required'),
  planId: z.number().min(1, 'Plan is required'),
  productId: z.number().min(1, 'Product is required'),
  workDate: z.string().min(1, 'Work date is required'),
  selectedSteps: z.array(z.object({
    productionStepDetailId: z.number(),
    actualQuantity: z.number().min(1, 'Quantity must be at least 1'),
    salaryNote: z.string().optional(),
    unitPrice: z.number().min(0).optional(),
  })).min(1, 'At least one production step must be selected'),
});

type BulkSalaryEntryFormData = z.infer<typeof bulkSalaryEntryFormSchema>;

type ProductionStepWithSelection = {
  id: number;
  stepName: string;
  selected: boolean;
  actualQuantity: number;
  salaryNote?: string;
  unitPrice?: number;
  // Validation data
  plannedQuantity?: number;
  limitQuantity?: number;
  previousEnteredQuantity?: number;
  validationStatus?: 'valid' | 'invalid' | 'pending';
  validationMessage?: string;
};

type EmployeeSalaryEntryBulkFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function EmployeeSalaryEntryBulkForm({
  onSuccess,
  onCancel,
}: EmployeeSalaryEntryBulkFormProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<{ userId: string; fullName: string | null; shortcut?: string | null } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{ id: number; planName: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; productCode: string; productName: string } | null>(null);
  const [productionSteps, setProductionSteps] = useState<ProductionStepWithSelection[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<{ id: number; productCode: string; productName: string }[]>([]);
  const [stepFilter, setStepFilter] = useState('');
  const [shortcutValue, setShortcutValue] = useState('');
  const [shortcutMessage, setShortcutMessage] = useState('');
  const [shortcutError, setShortcutError] = useState('');

  const createBulkMutation = useCreateEmployeeSalaryEntryBulk();
  const { data: relationOptions } = useEmployeeSalaryEntryRelationOptions();
  const { fetchQuantityLimit } = useProductionStepDetailQuantityLimit();
  const { fetchPlannedQuantity } = usePlanDetailPlannedQuantity();
  const { fetchPreviousQuantity } = useEmployeeSalaryEntryPreviousQuantity();


  // Default work date (today)
  const defaultWorkDate = new Date().toISOString().split('T')[0];

  const form = useForm<BulkSalaryEntryFormData>({
    resolver: zodResolver(bulkSalaryEntryFormSchema),
    defaultValues: {
      userId: '',
      planId: 0,
      productId: 0,
      workDate: defaultWorkDate,
      selectedSteps: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'selectedSteps',
  });

  // Load filtered products when plan changes
  useEffect(() => {
    const loadFilteredProducts = async () => {
      if (selectedPlan) {
        try {
          const response = await fetch(`/api/employeeSalaryEntries/relations/products-by-plan?planId=${selectedPlan.id}`);
          if (response.ok) {
            const data = await response.json();
            setFilteredProducts(data.data);
            // Reset product when plan changes
            setSelectedProduct(null);
            form.setValue('productId', 0);
          } else {
            console.error('Failed to load products by plan:', response.statusText);
            setFilteredProducts([]);
          }
        } catch (error) {
          console.error('Error loading products by plan:', error);
          setFilteredProducts([]);
        }
      } else {
        setFilteredProducts([]);
        setSelectedProduct(null);
        form.setValue('productId', 0);
      }
    };

    loadFilteredProducts();
  }, [selectedPlan, form]);

  // Load production steps when product changes
  useEffect(() => {
    const loadProductionSteps = async () => {
      if (selectedProduct) {
        try {
          const response = await fetch(`/api/employeeSalaryEntries/relations/production-step-details?productId=${selectedProduct.id}`);
          if (response.ok) {
            const data = await response.json();
            setProductionSteps(
              data.data.map((step: any) => ({
                id: step.id,
                stepName: step.stepName || `Step ${step.id}`,
                selected: false,
                actualQuantity: 1,
                salaryNote: '',
                unitPrice: 0,
                validationStatus: 'pending' as const,
              }))
            );
          } else {
            console.error('Failed to load production step details:', response.statusText);
            setProductionSteps([]);
          }
        } catch (error) {
          console.error('Error loading production step details:', error);
          setProductionSteps([]);
        }
      } else {
        setProductionSteps([]);
      }
    };

    loadProductionSteps();
  }, [selectedProduct]);

  // Function to handle shortcut search
  const handleShortcutSearch = useCallback((shortcut: string) => {
    setShortcutValue(shortcut);
    setShortcutError('');
    setShortcutMessage('');

    if (!shortcut.trim()) {
      return;
    }

    // Find employee by shortcut
    const matchedEmployee = relationOptions?.userSyncs.find(
      user => user.shortcut && user.shortcut.toLowerCase() === shortcut.toLowerCase().trim(),
    );

    if (matchedEmployee) {
      setSelectedEmployee(matchedEmployee);
      form.setValue('userId', matchedEmployee.userId);
      setShortcutMessage(`✅ Found: ${matchedEmployee.fullName}`);
    } else {
      setShortcutError(`❌ No employee found with shortcut: "${shortcut}"`);
    }
  }, [relationOptions?.userSyncs, form]);

  const handleEmployeeChange = (userId: string) => {
    const employee = relationOptions?.userSyncs.find(u => u.userId === userId);
    if (employee) {
      setSelectedEmployee(employee);
      form.setValue('userId', userId);
      setShortcutMessage('');
      setShortcutError('');
    }
  };

  const handlePlanChange = (planId: string) => {
    const plan = relationOptions?.plans.find(p => p.id === Number(planId));
    if (plan) {
      setSelectedPlan(plan);
      form.setValue('planId', plan.id);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = filteredProducts.find(p => p.id === Number(productId));
    if (product) {
      setSelectedProduct(product);
      form.setValue('productId', product.id);
    }
  };

  const validateStepQuantity = useCallback(async (stepId: number, quantity: number) => {
    if (!selectedPlan || !selectedProduct || !selectedEmployee) {
      return { valid: false, message: 'Please select plan, product, and employee first' };
    }

    try {
      // Fetch validation data
      const [limitData, plannedData, previousData] = await Promise.all([
        fetchQuantityLimit(stepId),
        fetchPlannedQuantity(selectedPlan.id, selectedProduct.id),
        fetchPreviousQuantity(selectedPlan.id, selectedProduct.id, stepId)
      ]);

      const plannedQuantity = plannedData?.totalPlannedQuantity || 0;
      const limitQuantity = limitData?.effectiveLimit || 0;
      const previousQuantity = previousData?.totalPreviousQuantity || 0;

      const totalUsed = quantity + previousQuantity;
      const totalAllowed = plannedQuantity + limitQuantity;

      if (totalUsed > totalAllowed) {
        return {
          valid: false,
          message: `Vượt quá giới hạn! Sử dụng: ${totalUsed}, Cho phép: ${totalAllowed}`,
          details: { plannedQuantity, limitQuantity, previousQuantity }
        };
      }

      return {
        valid: true,
        message: `Hợp lệ: ${totalUsed}/${totalAllowed}`,
        details: { plannedQuantity, limitQuantity, previousQuantity }
      };
    } catch (error) {
      return { valid: false, message: 'Error validating quantity' };
    }
  }, [selectedPlan, selectedProduct, selectedEmployee, fetchQuantityLimit, fetchPlannedQuantity, fetchPreviousQuantity]);

  const handleStepToggle = async (stepId: number) => {
    const stepIndex = productionSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    const step = productionSteps[stepIndex];
    if (!step) return;
    
    const newSelected = !step.selected;

    // Update step selection
    const updatedSteps = [...productionSteps];
    updatedSteps[stepIndex] = { ...step, selected: newSelected };
    setProductionSteps(updatedSteps);

    if (newSelected) {
      // Add to selected steps
      append({
        productionStepDetailId: stepId,
        actualQuantity: step.actualQuantity,
        salaryNote: step.salaryNote,
        unitPrice: step.unitPrice,
      });

      // Validate quantity
      const validation = await validateStepQuantity(stepId, step.actualQuantity);
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        validationStatus: validation.valid ? 'valid' : 'invalid',
        validationMessage: validation.message,
        ...validation.details
      };
      setProductionSteps(updatedSteps);
    } else {
      // Remove from selected steps
      const fieldIndex = fields.findIndex(field => field.productionStepDetailId === stepId);
      if (fieldIndex >= 0) {
        remove(fieldIndex);
      }
    }
  };

  const handleQuantityChange = (stepId: number, quantity: number) => {
    const stepIndex = productionSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    const currentStep = productionSteps[stepIndex];
    if (!currentStep) return;

    // Update step quantity only - no validation during typing
    const updatedSteps = [...productionSteps];
    updatedSteps[stepIndex] = { ...currentStep, actualQuantity: quantity };
    setProductionSteps(updatedSteps);

    // Update form field
    const fieldIndex = fields.findIndex(field => field.productionStepDetailId === stepId);
    if (fieldIndex >= 0) {
      form.setValue(`selectedSteps.${fieldIndex}.actualQuantity`, quantity);
    }
  };

  const handleQuantityBlur = async (stepId: number, quantity: number) => {
    const stepIndex = productionSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    const currentStep = productionSteps[stepIndex];
    if (!currentStep) return;

    const updatedSteps = [...productionSteps];

    // Validate quantity when user leaves the input field
    if (currentStep.selected) {
      const validation = await validateStepQuantity(stepId, quantity);
      updatedSteps[stepIndex] = {
        ...currentStep,
        validationStatus: validation.valid ? 'valid' : 'invalid',
        validationMessage: validation.message,
        ...validation.details
      };
      setProductionSteps(updatedSteps);
    }
  };

  const handleNotesChange = (stepId: number, notes: string) => {
    const stepIndex = productionSteps.findIndex(s => s.id === stepId);
    if (stepIndex === -1) return;

    const currentStep = productionSteps[stepIndex];
    if (!currentStep) return;

    // Update step notes
    const updatedSteps = [...productionSteps];
    updatedSteps[stepIndex] = { ...currentStep, salaryNote: notes };
    setProductionSteps(updatedSteps);

    // Update form field
    const fieldIndex = fields.findIndex(field => field.productionStepDetailId === stepId);
    if (fieldIndex >= 0) {
      form.setValue(`selectedSteps.${fieldIndex}.salaryNote`, notes);
    }
  };


  const onSubmit = async (data: BulkSalaryEntryFormData) => {
    try {
      // Prepare bulk creation data
      const bulkData = data.selectedSteps.map(step => {
        const stepInfo = productionSteps.find(s => s.id === step.productionStepDetailId);
        return {
          userId: data.userId,
          planId: data.planId,
          productId: data.productId,
          productionStepDetailId: step.productionStepDetailId,
          workDate: new Date(data.workDate),
          actualQuantity: step.actualQuantity,
          unitPrice: step.unitPrice,
          totalAmount: step.actualQuantity * (step.unitPrice || 0),
          salaryNote: step.salaryNote,
          status: 'draft',
          // Auto-filled validation data
          plannedQuantity: stepInfo?.plannedQuantity,
          limitQuantity: stepInfo?.limitQuantity,
          previousEnteredQuantity: stepInfo?.previousEnteredQuantity,
        };
      });

      await createBulkMutation.mutateAsync(bulkData);
      onSuccess();
    } catch (error) {
      console.error('Bulk form submission error:', error);
    }
  };

  // Filter production steps based on search
  const filteredProductionSteps = productionSteps.filter(step => {
    if (!stepFilter) return true;
    const searchTerm = stepFilter.toLowerCase();
    return step.stepName.toLowerCase().includes(searchTerm);
  });

  const selectedStepsCount = productionSteps.filter(step => step.selected).length;
  const invalidStepsCount = productionSteps.filter(step => step.selected && step.validationStatus === 'invalid').length;

  const isLoading = createBulkMutation.isPending;

  return (
    <div className="p-6 max-h-[90vh] overflow-auto bg-gray-50">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-3 rounded-full">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">💰 Tạo Bản Ghi Lương Nhân Viên</h1>
              <p className="text-green-100 text-lg">Thực hiện theo 3 bước đơn giản</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step by Step Guide */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
          <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">1</div>
          <h3 className="font-semibold text-blue-800">Chọn Nhân Viên</h3>
          <p className="text-sm text-blue-600">Tìm và chọn nhân viên cần tạo lương</p>
        </div>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 text-center">
          <div className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">2</div>
          <h3 className="font-semibold text-orange-800">Chọn Kế Hoạch & Sản Phẩm</h3>
          <p className="text-sm text-orange-600">Chọn dự án và sản phẩm làm việc</p>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
          <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">3</div>
          <h3 className="font-semibold text-green-800">Chọn Công Đoạn</h3>
          <p className="text-sm text-green-600">Đánh dấu công việc đã hoàn thành</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* STEP 1: Employee Selection */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden">
            <div className="bg-blue-500 text-white p-4 flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <div className="bg-white text-blue-500 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</div>
              </div>
              <div>
                <h2 className="text-xl font-bold">👤 BƯỚC 1: CHỌN NHÂN VIÊN</h2>
                <p className="text-blue-100">Tìm và chọn nhân viên cần tạo bản ghi lương</p>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-500 text-white p-2 rounded-full mr-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-800 text-lg">🔍 Tìm Kiếm Nhân Viên</h3>
                    <p className="text-blue-600 text-sm">Nhập mã nhân viên hoặc chọn từ danh sách</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-blue-300 shadow-sm">
                    <label className="mb-2 block text-lg font-bold text-blue-800 flex items-center">
                      <span className="bg-yellow-400 text-yellow-800 px-2 py-1 rounded text-sm mr-2">NHANH</span>
                      📝 Nhập Mã Nhân Viên
                    </label>
                    <p className="text-sm text-gray-600 mb-3">Nhập mã nhân viên để tìm nhanh (ví dụ: NV001)</p>
                    <Input
                      placeholder="Ví dụ: NV001, NV002..."
                      value={shortcutValue}
                      onChange={e => handleShortcutSearch(e.target.value)}
                      className="h-12 border-2 border-blue-300 text-lg font-medium"
                    />
                    {shortcutMessage && (
                      <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded flex items-center">
                        <span className="text-green-600 mr-2">✅</span>
                        <p className="text-sm font-medium text-green-700">{shortcutMessage}</p>
                      </div>
                    )}
                    {shortcutError && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded flex items-center">
                        <span className="text-red-600 mr-2">❌</span>
                        <p className="text-sm font-medium text-red-700">{shortcutError}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-blue-300 shadow-sm">
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-bold text-blue-800 flex items-center">
                            <span className="bg-blue-400 text-white px-2 py-1 rounded text-sm mr-2">CHỌN</span>
                            👤 Chọn Nhân Viên *
                          </FormLabel>
                          <p className="text-sm text-gray-600 mb-3">Chọn từ danh sách tất cả nhân viên</p>
                          <Select onValueChange={handleEmployeeChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-blue-300 text-lg">
                                <SelectValue placeholder="👆 Nhấp để chọn nhân viên..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relationOptions?.userSyncs?.map(option => (
                                <SelectItem key={option.userId} value={option.userId} className="text-lg p-3">
                                  <div className="flex items-center">
                                    <span className="font-medium">{option.fullName}</span>
                                    {option.shortcut && (
                                      <span className="ml-2 bg-gray-200 px-2 py-1 rounded text-sm">({option.shortcut})</span>
                                    )}
                                  </div>
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
              </div>

            </div>
          </div>

          {/* STEP 2: Plan & Product Selection */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 overflow-hidden">
            <div className="bg-orange-500 text-white p-4 flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <div className="bg-white text-orange-500 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</div>
              </div>
              <div>
                <h2 className="text-xl font-bold">📋 BƯỚC 2: CHỌN DỰ ÁN & SẢN PHẨM</h2>
                <p className="text-orange-100">Chọn dự án và sản phẩm mà nhân viên đang làm việc</p>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                <div className="flex items-center mb-3">
                  <div className="bg-orange-500 text-white p-2 rounded-full mr-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-800 text-lg">📁 Chọn Dự Án Làm Việc</h3>
                    <p className="text-orange-600 text-sm">Chọn theo thứ tự: Kế hoạch → Sản phẩm</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-orange-300 shadow-sm">
                    <FormField
                      control={form.control}
                      name="planId"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-lg font-bold text-orange-800 flex items-center">
                            <span className="bg-purple-400 text-white px-2 py-1 rounded text-sm mr-2">TRƯỚC</span>
                            📊 Chọn Kế Hoạch *
                          </FormLabel>
                          <p className="text-sm text-gray-600 mb-3">Chọn kế hoạch/dự án đang thực hiện</p>
                          <Select
                            onValueChange={handlePlanChange}
                            value={selectedPlan?.id.toString() || ''}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-orange-300 text-lg">
                                <SelectValue placeholder="👆 Nhấp để chọn kế hoạch..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relationOptions?.plans?.map(plan => (
                                <SelectItem key={plan.id} value={plan.id.toString()} className="text-lg p-3">
                                  <div className="flex items-center">
                                    <span className="font-medium">{plan.planName}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-orange-300 shadow-sm">
                    <FormField
                      control={form.control}
                      name="productId"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-lg font-bold text-orange-800 flex items-center">
                            <span className="bg-green-400 text-white px-2 py-1 rounded text-sm mr-2">SAU</span>
                            📦 Chọn Sản Phẩm *
                          </FormLabel>
                          <p className="text-sm text-gray-600 mb-3">
                            {!selectedPlan ? "⚠️ Hãy chọn kế hoạch trước" : "Chọn sản phẩm trong kế hoạch"}
                          </p>
                          <Select
                            onValueChange={handleProductChange}
                            value={selectedProduct?.id.toString() || ''}
                            disabled={!selectedPlan}
                          >
                            <FormControl>
                              <SelectTrigger className={`h-12 border-2 text-lg ${!selectedPlan ? 'border-gray-300 bg-gray-100' : 'border-orange-300'}`}>
                                <SelectValue placeholder={
                                  !selectedPlan ? "⏳ Chọn kế hoạch trước..." : 
                                  filteredProducts.length === 0 ? "❌ Không có sản phẩm" : 
                                  "👆 Nhấp để chọn sản phẩm..."
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredProducts.map(product => (
                                <SelectItem key={product.id} value={product.id.toString()} className="text-lg p-3">
                                  <div className="flex items-center">
                                    <span className="font-medium">{product.productName}</span>
                                    <span className="ml-2 bg-gray-200 px-2 py-1 rounded text-sm">({product.productCode})</span>
                                  </div>
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
              </div>

              <FormField
                control={form.control}
                name="workDate"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormLabel>Ngày làm việc *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* STEP 3: Production Steps Selection */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 overflow-hidden">
            <div className="bg-green-500 text-white p-4 flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <div className="bg-white text-green-500 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</div>
              </div>
              <div>
                <h2 className="text-xl font-bold">✅ BƯỚC 3: CHỌN CÔNG ĐOẠN HOÀN THÀNH</h2>
                <p className="text-green-100">Đánh dấu những công việc mà nhân viên đã hoàn thành</p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="bg-green-500 text-white p-2 rounded-full mr-3">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800 text-lg">📋 Danh Sách Công Đoạn</h3>
                      <p className="text-green-600 text-sm">Tích chọn công đoạn đã hoàn thành và nhập số lượng</p>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg border border-green-300 shadow-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedStepsCount}</div>
                      <div className="text-xs text-green-600">Công đoạn đã chọn</div>
                    </div>
                  </div>
                </div>
                
                {invalidStepsCount > 0 && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <p className="text-sm font-medium text-red-700">
                      Có {invalidStepsCount} công đoạn không hợp lệ - vui lòng kiểm tra lại số lượng
                    </p>
                  </div>
                )}
              </div>

              {/* Search/Filter Bar */}
              <div className="bg-white p-4 rounded-lg border border-green-300 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-green-800 flex items-center">
                    <span className="bg-blue-400 text-white px-2 py-1 rounded text-sm mr-2">TÌM</span>
                    🔍 Tìm Kiếm Công Đoạn
                  </h4>
                  <div className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {filteredProductionSteps.length} / {productionSteps.length} công đoạn
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-400" />
                  <Input
                    type="text"
                    placeholder="💡 Nhập tên công đoạn để tìm nhanh..."
                    value={stepFilter}
                    onChange={(e) => setStepFilter(e.target.value)}
                    className="pl-12 pr-12 h-12 border-2 border-green-300 text-lg"
                  />
                  {stepFilter && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-red-100"
                      onClick={() => setStepFilter('')}
                    >
                      <X className="h-5 w-5 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border-2 border-green-300 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={filteredProductionSteps.length > 0 && filteredProductionSteps.every(step => step.selected)}
                        onCheckedChange={(checked) => {
                          filteredProductionSteps.forEach(step => {
                            if (checked !== step.selected) {
                              handleStepToggle(step.id);
                            }
                          });
                        }}
                        className="border-2 border-white data-[state=checked]:bg-white data-[state=checked]:text-green-500"
                      />
                      <span className="font-bold text-lg">📋 DANH SÁCH CÔNG ĐOẠN</span>
                    </div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      Tích để chọn công đoạn đã hoàn thành
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 border-b-2 border-green-200">
                  <div className="grid grid-cols-4 gap-4 text-sm font-bold text-gray-700">
                    <div className="flex items-center">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs mr-2">CHỌN</span>
                      Tên Công Đoạn
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs mr-2">SỐ LƯỢNG</span>
                      Hoàn Thành
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs mr-2">GHI CHÚ</span>
                      Mô Tả
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs mr-2">TRẠNG THÁI</span>
                      Kiểm Tra
                    </div>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {filteredProductionSteps.map((step, index) => (
                    <div 
                      key={step.id}
                      className={`grid grid-cols-4 gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        step.selected ? 'bg-green-50 border-green-200' : ''
                      }`}
                    >
                      {/* Checkbox and Step Name */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={step.selected}
                          onCheckedChange={() => handleStepToggle(step.id)}
                          className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{step.stepName}</div>
                          <div className="text-xs text-gray-500">#{index + 1}</div>
                        </div>
                      </div>

                      {/* Quantity Input */}
                      <div className="flex items-center justify-center">
                        {step.selected ? (
                          <Input
                            type="number"
                            min="1"
                            value={step.actualQuantity}
                            onChange={(e) => handleQuantityChange(step.id, parseInt(e.target.value) || 1)}
                            onBlur={(e) => handleQuantityBlur(step.id, parseInt(e.target.value) || 1)}
                            className="w-28 h-12 text-center border-2 border-orange-300 focus:border-orange-500 font-bold text-xl"
                            placeholder="1"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">Chưa chọn</div>
                        )}
                      </div>

                      {/* Notes */}
                      <div className="flex items-center">
                        {step.selected ? (
                          <Textarea
                            value={step.salaryNote || ''}
                            onChange={(e) => handleNotesChange(step.id, e.target.value)}
                            className="min-h-10 resize-none border-2 border-purple-300 focus:border-purple-500"
                            placeholder="💬 Thêm ghi chú..."
                            rows={2}
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">Chưa chọn</div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-center">
                        {step.selected ? (
                          step.validationStatus && (
                            <div className={`px-3 py-2 rounded-full text-sm font-bold flex items-center space-x-1 ${
                              step.validationStatus === 'valid' 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : step.validationStatus === 'invalid'
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            }`}>
                              {step.validationStatus === 'valid' && <span className="mr-1">✅</span>}
                              {step.validationStatus === 'invalid' && <span className="mr-1">❌</span>}
                              {step.validationStatus === 'pending' && <span className="mr-1">⏳</span>}
                              <span>{step.validationMessage}</span>
                            </div>
                          )
                        ) : (
                          <div className="text-gray-400 text-sm">Chờ kiểm tra</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty state */}
                {filteredProductionSteps.length === 0 && productionSteps.length > 0 && (
                  <div className="py-12 text-center bg-gray-50">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-lg font-medium text-gray-600 mb-2">Không tìm thấy công đoạn nào</p>
                    <p className="text-sm text-gray-500 mb-4">Thử thay đổi từ khóa tìm kiếm</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStepFilter('')}
                      className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                    Xóa bộ lọc
                  </Button>
                </div>
              )}

              {productionSteps.length === 0 && selectedProduct && (
                <div className="py-12 text-center bg-gray-50">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-lg font-medium text-gray-600 mb-2">Chưa có công đoạn nào</p>
                  <p className="text-sm text-gray-500">Sản phẩm này chưa có công đoạn để chọn</p>
                </div>
              )}
              </div>

              {selectedStepsCount === 0 && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center">
                  <span className="text-red-600 mr-3 text-2xl">⚠️</span>
                  <div>
                    <p className="font-bold text-red-800">Cần chọn ít nhất một công đoạn</p>
                    <p className="text-sm text-red-600">Vui lòng tích chọn công đoạn mà nhân viên đã hoàn thành</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {createBulkMutation.error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center">
                    <span className="text-red-600 mr-3 text-xl">❌</span>
                    <div>
                      <p className="font-bold text-red-800">Có lỗi xảy ra</p>
                      <p className="text-sm text-red-600">{createBulkMutation.error.message}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 ml-6">
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel} 
                  disabled={isLoading}
                  className="h-14 px-8 border-2 border-gray-300 hover:bg-gray-50 text-lg font-medium"
                >
                  <span className="mr-2">❌</span>
                  Hủy Bỏ
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || selectedStepsCount === 0 || invalidStepsCount > 0 || !form.formState.isValid}
                  className="h-14 px-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-lg font-bold shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2">⏳</span>
                      Đang tạo {selectedStepsCount} bản ghi...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">💾</span>
                      Tạo {selectedStepsCount} Bản Ghi Lương
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}