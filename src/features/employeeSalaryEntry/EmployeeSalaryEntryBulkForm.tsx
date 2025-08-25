/**
 * EmployeeSalaryEntry Bulk Form Component
 * Allows selecting multiple production steps with quantities for salary entries
 * Based on OutsourceOrderDetailBulkForm pattern
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { useEmployeeSalaryEntryPreviousQuantity } from '@/hooks/useEmployeeSalaryEntryPreviousQuantity';
import { useEmployeeSalaryEntryRelationOptions } from '@/hooks/useEmployeeSalaryEntrys';
import { usePlanDetailPlannedQuantity } from '@/hooks/usePlanDetailPlannedQuantity';
import { useProductionStepDetailQuantityLimit } from '@/hooks/useProductionStepDetailQuantityLimit';

// Form schema for bulk creation
const bulkSalaryEntryFormSchema = z.object({
  userId: z.string().min(1, 'Employee is required'),
  planId: z.number().min(1, 'Plan is required'),
  productId: z.number().min(1, 'Product is required'),
  workDate: z.string().min(1, 'Work date is required'),
  selectedSteps: z.array(z.object({
    productionStepDetailId: z.number(),
    actualQuantity: z.number().min(0, 'Quantity must be at least 0'),
    salaryNote: z.string().optional(),
    unitPrice: z.number().min(0).optional(),
  })).min(1, 'At least one production step must be selected'),
});

type BulkSalaryEntryFormData = z.infer<typeof bulkSalaryEntryFormSchema>;

type ProductionStepWithSelection = {
  id: number;
  stepName: string;
  stepCode?: string;
  filmSequence?: string | null;
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
  const [categoryValue, setCategoryValue] = useState('');
  const [categoryMessage, setCategoryMessage] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const createBulkMutation = useCreateEmployeeSalaryEntryBulk();
  const { data: relationOptions } = useEmployeeSalaryEntryRelationOptions();
  const { fetchQuantityLimit } = useProductionStepDetailQuantityLimit();
  const { fetchPlannedQuantity } = usePlanDetailPlannedQuantity();
  const { fetchPreviousQuantity } = useEmployeeSalaryEntryPreviousQuantity();

  const t = useTranslations('employeeSalaryEntry');

  // Get current month plan name (format: MMYYYY)
  const getCurrentMonthPlanName = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}${year}`;
  };

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

  // Auto-select current month plan when relationOptions loads
  useEffect(() => {
    if (relationOptions?.plans && relationOptions.plans.length > 0 && !selectedPlan) {
      const currentMonthPlanName = getCurrentMonthPlanName();

      // Try to find exact match first
      let currentMonthPlan = relationOptions.plans.find(
        plan => plan.planName === currentMonthPlanName,
      );

      // If not found, try with different formats
      if (!currentMonthPlan) {
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const year = new Date().getFullYear();
        const alternativeFormats = [
          `${month}/${year}`,
          `${month}-${year}`,
          `${month}.${year}`,
          `${month}${year}`, // Already tried above but keep for completeness
        ];

        for (const format of alternativeFormats) {
          currentMonthPlan = relationOptions.plans.find(
            plan => plan.planName === format,
          );
          if (currentMonthPlan) {
            break;
          }
        }
      }

      if (currentMonthPlan) {
        setSelectedPlan(currentMonthPlan);
        form.setValue('planId', currentMonthPlan.id);
      }
    }
  }, [relationOptions, selectedPlan, form]);

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

  // Load all production steps on component mount (not dependent on product)
  useEffect(() => {
    const loadProductionSteps = async () => {
      try {
        const response = await fetch(`/api/employeeSalaryEntries/relations/production-step-details?loadAll=true`);
        if (response.ok) {
          const data = await response.json();
          // Sort by filmSequence as number, then by stepName if filmSequence is null/empty
          const sortedSteps = data.data.sort((a: any, b: any) => {
            // Convert filmSequence to numbers
            const filmSeqA = a.filmSequence ? Number.parseFloat(a.filmSequence) : null;
            const filmSeqB = b.filmSequence ? Number.parseFloat(b.filmSequence) : null;

            // If both have valid filmSequence numbers, sort by number
            if (filmSeqA !== null && filmSeqB !== null && !Number.isNaN(filmSeqA) && !Number.isNaN(filmSeqB)) {
              return filmSeqA - filmSeqB;
            }

            // If only one has valid filmSequence, prioritize it
            if (filmSeqA !== null && !Number.isNaN(filmSeqA) && (filmSeqB === null || Number.isNaN(filmSeqB))) {
              return -1;
            }
            if (filmSeqB !== null && !Number.isNaN(filmSeqB) && (filmSeqA === null || Number.isNaN(filmSeqA))) {
              return 1;
            }

            // If neither has valid filmSequence, sort by stepName
            const stepNameA = a.stepName || `Step ${a.id}`;
            const stepNameB = b.stepName || `Step ${b.id}`;
            return stepNameA.localeCompare(stepNameB);
          });

          setProductionSteps(
            sortedSteps.map((step: any) => ({
              id: step.id,
              stepName: step.stepName || `Step ${step.id}`,
              stepCode: step.stepCode || '',
              filmSequence: step.filmSequence || null,
              selected: false,
              actualQuantity: 0,
              salaryNote: '',
              unitPrice: 0,
              validationStatus: 'pending' as const,
            })),
          );
        } else {
          console.error('Failed to load production step details:', response.statusText);
          setProductionSteps([]);
        }
      } catch (error) {
        console.error('Error loading production step details:', error);
        setProductionSteps([]);
      }
    };

    loadProductionSteps();
  }, []); // Only run once on mount

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
      setShortcutMessage(`${t('bulk.employeeFound')} ${matchedEmployee.fullName}`);
    } else {
      setShortcutError(`${t('bulk.employeeNotFound')} "${shortcut}"`);
    }
  }, [relationOptions?.userSyncs, form, t]);

  const handleCategorySearch = useCallback(async (category: string) => {
    setCategoryValue(category);
    setCategoryError('');
    setCategoryMessage('');

    if (!category.trim()) {
      return;
    }

    try {
      // Fetch product by category
      const params = new URLSearchParams();
      params.append('category', category.trim());
      if (selectedPlan) {
        params.append('planId', selectedPlan.id.toString());
      }

      const response = await fetch(`/api/employeeSalaryEntries/relations/product-by-category?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.success && data.data) {
        // Auto-populate product selection
        const product = data.data;
        setSelectedProduct(product);
        form.setValue('productId', product.id);
        setCategoryMessage(`✅ ${t('bulk.productFound')} ${product.productName}`);
      } else {
        setCategoryError(`❌ ${t('bulk.productNotFound')} "${category}"`);
      }
    } catch {
      setCategoryError(`❌ ${t('bulk.errorSearchingProduct')}`);
    }
  }, [selectedPlan, form, t]);

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
      setCategoryMessage('');
      setCategoryError('');
    }
  };

  const validateStepQuantity = useCallback(async (stepId: number, _quantity: number) => {
    if (!selectedPlan || !selectedProduct || !selectedEmployee) {
      return { valid: false, message: t('bulk.validationPleaseSelect') };
    };

    try {
      // Fetch validation data
      const [limitData, plannedData, previousData] = await Promise.all([
        fetchQuantityLimit(stepId),
        fetchPlannedQuantity(selectedPlan.id, selectedProduct.id),
        fetchPreviousQuantity(selectedPlan.id, selectedProduct.id, stepId),
      ]);

      const plannedQuantity = plannedData?.totalPlannedQuantity || 0;
      const limitQuantity = limitData?.effectiveLimit || 0;
      const previousQuantity = previousData?.totalPreviousQuantity || 0;

      // TODO: Temporarily disable validation to allow saves
      // const totalUsed = quantity + previousQuantity;
      // const totalAllowed = plannedQuantity + limitQuantity;

      // if (totalUsed > totalAllowed) {
      //   return {
      //     valid: false,
      //     message: t('bulk.validationExceededLimit', { used: totalUsed, allowed: totalAllowed }),
      //     details: { plannedQuantity, limitQuantity, previousQuantity }
      //   };
      // }

      return {
        valid: true,
        message: 'OK',
        details: { plannedQuantity, limitQuantity, previousQuantity },
      };
    } catch {
      return { valid: false, message: t('bulk.validationError') };
    }
  }, [selectedPlan, selectedProduct, selectedEmployee, fetchQuantityLimit, fetchPlannedQuantity, fetchPreviousQuantity, t]);

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
        ...validation.details,
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
    if (stepIndex === -1) {
      return;
    }

    const currentStep = productionSteps[stepIndex];
    if (!currentStep) {
      return;
    }

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
    if (stepIndex === -1) {
      return;
    }

    const currentStep = productionSteps[stepIndex];
    if (!currentStep) {
      return;
    }

    const updatedSteps = [...productionSteps];

    // Validate quantity when user leaves the input field
    if (currentStep.selected) {
      const validation = await validateStepQuantity(stepId, quantity);
      updatedSteps[stepIndex] = {
        ...currentStep,
        validationStatus: validation.valid ? 'valid' : 'invalid',
        validationMessage: validation.message,
        ...validation.details,
      };
      setProductionSteps(updatedSteps);
    }
  };

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
      const bulkData = data.selectedSteps.map((step) => {
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
          // Validation data will be fetched by backend during creation
          plannedQuantity: stepInfo?.plannedQuantity || 0,
          limitQuantity: stepInfo?.limitQuantity || 0,
          previousEnteredQuantity: stepInfo?.previousEnteredQuantity || 0,
        };
      });

      await createBulkMutation.mutateAsync(bulkData);
      onSuccess();
    } catch (error) {
      console.error('Bulk form submission error:', error);
    }
  };

  // Filter production steps based on film_sequence only (exact match)
  const filteredProductionSteps = productionSteps.filter((step) => {
    if (!stepFilter) {
      return true;
    }
    const searchTerm = stepFilter.toLowerCase();

    // Search in film sequence (exact match)
    const filmSequenceMatch = step.filmSequence
      && step.filmSequence.toLowerCase() === searchTerm;

    return filmSequenceMatch;
  });

  const selectedStepsCount = productionSteps.filter(step => step.selected).length;
  const invalidStepsCount = productionSteps.filter(step => step.selected && step.validationStatus === 'invalid').length;

  const isLoading = createBulkMutation.isPending;

  return (
    <div className="max-h-[90vh] overflow-auto bg-gray-50 p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="rounded-xl bg-gradient-to-r from-green-500 to-blue-500 p-3 text-white shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-white/20 p-3">
              <svg className="size-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                💰
                {t('bulk.createSalaryEntry')}
              </h1>
              <p className="text-lg text-green-100">{t('bulk.followSteps')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step by Step Guide */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-1 text-center">
          <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">1</div>
          <h3 className="font-semibold text-blue-800">{t('bulk.selectEmployee')}</h3>
          <p className="text-sm text-blue-600">{t('bulk.selectEmployeeDesc')}</p>
        </div>
        <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-1 text-center">
          <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white">2</div>
          <h3 className="font-semibold text-orange-800">{t('bulk.selectPlanProduct')}</h3>
          <p className="text-sm text-orange-600">{t('bulk.selectPlanProductDesc')}</p>
        </div>
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-1 text-center">
          <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-green-500 text-lg font-bold text-white">3</div>
          <h3 className="font-semibold text-green-800">{t('bulk.selectSteps')}</h3>
          <p className="text-sm text-green-600">{t('bulk.selectStepsDesc')}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* STEP 1: Employee Selection */}
          <div className="overflow-hidden rounded-xl border-2 border-blue-200 bg-white shadow-lg">
            <div className="flex items-center space-x-3 bg-blue-500 p-2 text-white">
              <div className="rounded-full bg-white/20 p-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-500">1</div>
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  👤
                  {t('bulk.step1Title')}
                </h2>
                <p className="text-blue-100">{t('bulk.step1Desc')}</p>
              </div>
            </div>
            <div className="p-6">
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <div className="mb-3 flex items-center">
                  <div className="mr-3 rounded-full bg-blue-500 p-2 text-white">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-blue-800">
                      🔍
                      {t('bulk.searchEmployee')}
                    </h3>
                    <p className="text-sm text-blue-600">{t('bulk.searchEmployeeDesc')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-lg border border-blue-300 bg-white p-4 shadow-sm">
                    <label className="mb-2 flex items-center text-lg font-bold text-blue-800">
                      <span className="mr-2 rounded bg-yellow-400 px-2 py-1 text-sm text-yellow-800">NHANH</span>
                      📝
                      {' '}
                      {t('bulk.quickSearch')}
                    </label>
                    <p className="mb-3 text-sm text-gray-600">{t('bulk.quickSearchDesc')}</p>
                    <Input
                      placeholder={t('bulk.quickSearchPlaceholder')}
                      value={shortcutValue}
                      onChange={e => handleShortcutSearch(e.target.value)}
                      className="h-12 border-2 border-blue-300 text-lg font-medium"
                    />
                    {shortcutMessage && (
                      <div className="mt-2 flex items-center rounded border border-green-300 bg-green-100 p-2">
                        <span className="mr-2 text-green-600">✅</span>
                        <p className="text-sm font-medium text-green-700">{shortcutMessage}</p>
                      </div>
                    )}
                    {shortcutError && (
                      <div className="mt-2 flex items-center rounded border border-red-300 bg-red-100 p-2">
                        <span className="mr-2 text-red-600">❌</span>
                        <p className="text-sm font-medium text-red-700">{shortcutError}</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-blue-300 bg-white p-4 shadow-sm">
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center text-lg font-bold text-blue-800">
                            <span className="mr-2 rounded bg-blue-400 px-2 py-1 text-sm text-white">{t('bulk.selectLabel')}</span>
                            👤
                            {' '}
                            {t('bulk.selectFromList')}
                            {' '}
                            *
                          </FormLabel>
                          <p className="mb-3 text-sm text-gray-600">{t('bulk.selectFromListDesc')}</p>
                          <Select onValueChange={handleEmployeeChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-blue-300 text-lg">
                                <SelectValue placeholder={t('bulk.selectFromListPlaceholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relationOptions?.userSyncs?.map(option => (
                                <SelectItem key={option.userId} value={option.userId} className="p-3 text-lg">
                                  <div className="flex items-center">
                                    <span className="font-medium">{option.fullName}</span>
                                    {option.shortcut && (
                                      <span className="ml-2 rounded bg-gray-200 px-2 py-1 text-sm">
                                        (
                                        {option.shortcut}
                                        )
                                      </span>
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
          <div className="overflow-hidden rounded-xl border-2 border-orange-200 bg-white shadow-lg">
            <div className="flex items-center space-x-3 bg-orange-500 p-2 text-white">
              <div className="rounded-full bg-white/20 p-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-white text-sm font-bold text-orange-500">2</div>
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  📋
                  {t('bulk.step2Title')}
                </h2>
                <p className="text-orange-100">{t('bulk.step2Desc')}</p>
              </div>
            </div>
            <div className="p-6">
              <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
                <div className="mb-3 flex items-center">
                  <div className="mr-3 rounded-full bg-orange-500 p-2 text-white">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-orange-800">
                      📁
                      {t('bulk.selectProject')}
                    </h3>
                    <p className="text-sm text-orange-600">{t('bulk.selectProjectDesc')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="rounded-lg border border-orange-300 bg-white p-4 shadow-sm">
                    <FormField
                      control={form.control}
                      name="planId"
                      render={() => (
                        <FormItem>
                          <FormLabel className="flex items-center text-lg font-bold text-orange-800">
                            <span className="mr-2 rounded bg-purple-400 px-2 py-1 text-sm text-white">{t('bulk.firstLabel')}</span>
                            📊
                            {' '}
                            {t('bulk.selectPlan')}
                            {' '}
                            *
                          </FormLabel>
                          <p className="mb-3 text-sm text-gray-600">{t('bulk.selectPlanDesc')}</p>
                          <Select
                            onValueChange={handlePlanChange}
                            value={selectedPlan?.id.toString() || ''}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-orange-300 text-lg">
                                <SelectValue placeholder={t('bulk.selectPlanPlaceholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relationOptions?.plans?.map(plan => (
                                <SelectItem key={plan.id} value={plan.id.toString()} className="p-3 text-lg">
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

                  <div className="rounded-lg border border-orange-300 bg-white p-4 shadow-sm">
                    <label className="mb-2 flex items-center text-lg font-bold text-orange-800">
                      <span className="mr-2 rounded bg-yellow-400 px-2 py-1 text-sm text-yellow-800">{t('bulk.quickLabel')}</span>
                      🏷️
                      {' '}
                      {t('bulk.categorySearch')}
                    </label>
                    <p className="mb-3 text-sm text-gray-600">{t('bulk.categorySearchDesc')}</p>
                    <Input
                      placeholder={t('bulk.categorySearchPlaceholder')}
                      value={categoryValue}
                      onChange={e => handleCategorySearch(e.target.value)}
                      className={`h-12 border-2 text-lg font-medium ${!selectedPlan ? 'border-gray-300 bg-gray-100' : 'border-orange-300'}`}
                      disabled={!selectedPlan}
                    />
                    {categoryMessage && (
                      <div className="mt-2 flex items-center rounded border border-green-300 bg-green-100 p-2">
                        <span className="mr-2 text-green-600">✅</span>
                        <p className="text-sm font-medium text-green-700">{categoryMessage}</p>
                      </div>
                    )}
                    {categoryError && (
                      <div className="mt-2 flex items-center rounded border border-red-300 bg-red-100 p-2">
                        <span className="mr-2 text-red-600">❌</span>
                        <p className="text-sm font-medium text-red-700">{categoryError}</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-orange-300 bg-white p-4 shadow-sm">
                    <FormField
                      control={form.control}
                      name="productId"
                      render={() => (
                        <FormItem>
                          <FormLabel className="flex items-center text-lg font-bold text-orange-800">
                            <span className="mr-2 rounded bg-green-400 px-2 py-1 text-sm text-white">{t('bulk.secondLabel')}</span>
                            📦
                            {' '}
                            {t('bulk.selectProduct')}
                            {' '}
                            *
                          </FormLabel>
                          <p className="mb-3 text-sm text-gray-600">
                            {!selectedPlan ? t('bulk.selectPlanFirst') : t('bulk.selectProductDesc')}
                          </p>
                          <Select
                            onValueChange={handleProductChange}
                            value={selectedProduct?.id.toString() || ''}
                            disabled={!selectedPlan}
                          >
                            <FormControl>
                              <SelectTrigger className={`h-12 border-2 text-lg ${!selectedPlan ? 'border-gray-300 bg-gray-100' : 'border-orange-300'}`}>
                                <SelectValue placeholder={
                                  !selectedPlan
                                    ? t('bulk.waitingPlan')
                                    : filteredProducts.length === 0
                                      ? t('bulk.noProducts')
                                      : t('bulk.selectProductPlaceholder')
                                }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredProducts.map(product => (
                                <SelectItem key={product.id} value={product.id.toString()} className="p-3 text-lg">
                                  <div className="flex items-center">
                                    <span className="font-medium">{product.productName}</span>
                                    <span className="ml-2 rounded bg-gray-200 px-2 py-1 text-sm">
                                      (
                                      {product.productCode}
                                      )
                                    </span>
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
                    <FormLabel>
                      {t('bulk.workDate')}
                      {' '}
                      *
                    </FormLabel>
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
          <div className="overflow-hidden rounded-xl border-2 border-green-200 bg-white shadow-lg">
            <div className="flex items-center space-x-3 bg-green-500 p-2 text-white">
              <div className="rounded-full bg-white/20 p-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-white text-sm font-bold text-green-500">3</div>
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  ✅
                  {t('bulk.step3Title')}
                </h2>
                <p className="text-green-100">{t('bulk.step3Desc')}</p>
              </div>
            </div>

            <div className="p-6">
              {/* Combined Search & Actions Bar */}
              <div className="mb-4 rounded-xl border-2 border-gray-200 bg-white p-4 shadow-lg">

                {/* Search and Action Buttons Row */}
                <div className="flex items-center gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-green-400" />
                    <Input
                      type="text"
                      placeholder={t('bulk.searchStepsPlaceholder')}
                      value={stepFilter}
                      onChange={e => setStepFilter(e.target.value)}
                      className="h-12 border-2 border-green-300 px-12 text-lg"
                    />
                    {stepFilter && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 size-8 -translate-y-1/2 p-0 hover:bg-red-100"
                        onClick={() => setStepFilter('')}
                      >
                        <X className="size-5 text-red-500" />
                      </Button>
                    )}
                  </div>

                  {/* Cancel Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="h-12 border-2 border-gray-300 px-6 text-base font-medium hover:bg-gray-50"
                  >
                    <span className="mr-2">❌</span>
                    {t('bulk.cancel')}
                  </Button>

                  {/* Create Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || selectedStepsCount === 0 || invalidStepsCount > 0 || !form.formState.isValid}
                    className="h-12 bg-gradient-to-r from-green-500 to-blue-500 px-6 text-base font-bold text-white shadow-lg hover:from-green-600 hover:to-blue-600"
                  >
                    {isLoading
                      ? (
                          <>
                            <span className="mr-2">⏳</span>
                            {t('bulk.creating', { count: selectedStepsCount })}
                          </>
                        )
                      : (
                          <>
                            <span className="mr-2">💾</span>
                            {t('bulk.createRecords', { count: selectedStepsCount })}
                          </>
                        )}
                  </Button>
                </div>

                {/* Error Message */}
                {createBulkMutation.error && (
                  <div className="flex items-center rounded-lg border-2 border-red-200 bg-red-50 p-3">
                    <span className="mr-3 text-lg text-red-600">❌</span>
                    <div>
                      <p className="font-bold text-red-800">{t('bulk.errorOccurred')}</p>
                      <p className="text-sm text-red-600">{createBulkMutation.error.message}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-lg border-2 border-green-300 bg-white shadow-lg">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={filteredProductionSteps.length > 0 && filteredProductionSteps.every(step => step.selected)}
                        onCheckedChange={(checked) => {
                          filteredProductionSteps.forEach((step) => {
                            if (checked !== step.selected) {
                              handleStepToggle(step.id);
                            }
                          });
                        }}
                        className="border-2 border-white data-[state=checked]:bg-white data-[state=checked]:text-green-500"
                      />
                      <span className="text-lg font-bold">
                        📋
                        {t('bulk.stepListHeader')}
                      </span>
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                      {t('bulk.stepListSubHeader')}
                    </span>
                  </div>
                </div>

                <div className="border-b-2 border-green-200 bg-gray-50 p-3">
                  <div className="grid grid-cols-4 gap-4 text-sm font-bold text-gray-700">
                    <div className="flex items-center">
                      <span className="mr-2 rounded bg-blue-500 px-2 py-1 text-xs text-white">{t('bulk.selectLabel')}</span>
                      {t('bulk.stepName')}
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="mr-2 rounded bg-orange-500 px-2 py-1 text-xs text-white">{t('bulk.quantityLabel')}</span>
                      {t('bulk.stepQuantity')}
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="mr-2 rounded bg-purple-500 px-2 py-1 text-xs text-white">{t('bulk.notesLabel')}</span>
                      {t('bulk.stepNotes')}
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="mr-2 rounded bg-green-500 px-2 py-1 text-xs text-white">{t('bulk.statusLabel')}</span>
                      {t('bulk.stepStatus')}
                    </div>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {filteredProductionSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`grid grid-cols-4 gap-4 border-b border-gray-200 p-4 transition-colors hover:bg-gray-50 ${
                        step.selected ? 'border-green-200 bg-green-50' : ''
                      }`}
                    >
                      {/* Checkbox and Step Name */}
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={step.selected}
                          onCheckedChange={() => handleStepToggle(step.id)}
                          className="data-[state=checked]:border-green-500 data-[state=checked]:bg-green-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {step.stepName}
                            {step.filmSequence && ` : ${step.filmSequence}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            #
                            {index + 1}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Input */}
                      <div className="flex items-center justify-center">
                        {step.selected
                          ? (
                              <Input
                                type="text"
                                value={step.actualQuantity.toString()}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  const numValue = value === '' ? 0 : Number.parseInt(value);
                                  handleQuantityChange(step.id, numValue);
                                }}
                                onBlur={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  const numValue = value === '' ? 0 : Number.parseInt(value);
                                  handleQuantityBlur(step.id, numValue);
                                }}
                                className="h-12 w-28 border-2 border-orange-300 text-center text-xl font-bold focus:border-orange-500"
                                placeholder="0"
                              />
                            )
                          : (
                              <div className="text-sm text-gray-400">{t('bulk.notSelected')}</div>
                            )}
                      </div>

                      {/* Notes */}
                      <div className="flex items-center">
                        {step.selected
                          ? (
                              <Textarea
                                value={step.salaryNote || ''}
                                onChange={e => handleNotesChange(step.id, e.target.value)}
                                className="min-h-10 resize-none border-2 border-purple-300 focus:border-purple-500"
                                placeholder={t('bulk.addNotes')}
                                rows={2}
                              />
                            )
                          : (
                              <div className="text-sm text-gray-400">{t('bulk.notSelected')}</div>
                            )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-center">
                        {step.selected
                          ? (
                              step.validationStatus && (
                                <div className={`flex items-center space-x-1 rounded-full px-3 py-2 text-sm font-bold ${
                                  step.validationStatus === 'valid'
                                    ? 'border border-green-300 bg-green-100 text-green-800'
                                    : step.validationStatus === 'invalid'
                                      ? 'border border-red-300 bg-red-100 text-red-800'
                                      : 'border border-yellow-300 bg-yellow-100 text-yellow-800'
                                }`}
                                >
                                  {step.validationStatus === 'valid' && <span className="mr-1">✅</span>}
                                  {step.validationStatus === 'invalid' && <span className="mr-1">❌</span>}
                                  {step.validationStatus === 'pending' && <span className="mr-1">⏳</span>}
                                  <span>{step.validationMessage}</span>
                                </div>
                              )
                            )
                          : (
                              <div className="text-sm text-gray-400">{t('bulk.waitingCheck')}</div>
                            )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty state */}
                {filteredProductionSteps.length === 0 && productionSteps.length > 0 && (
                  <div className="bg-gray-50 py-12 text-center">
                    <div className="mb-4 text-6xl">🔍</div>
                    <p className="mb-2 text-lg font-medium text-gray-600">{t('bulk.noStepsFound')}</p>
                    <p className="mb-4 text-sm text-gray-500">{t('bulk.changeSearchTerm')}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStepFilter('')}
                      className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      {t('bulk.clearFilter')}
                    </Button>
                  </div>
                )}

                {productionSteps.length === 0 && selectedProduct && (
                  <div className="bg-gray-50 py-12 text-center">
                    <div className="mb-4 text-6xl">📋</div>
                    <p className="mb-2 text-lg font-medium text-gray-600">{t('bulk.noStepsAvailable')}</p>
                    <p className="text-sm text-gray-500">{t('bulk.noStepsForProduct')}</p>
                  </div>
                )}
              </div>

              {selectedStepsCount === 0 && (
                <div className="mt-4 flex items-center rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <span className="mr-3 text-2xl text-red-600">⚠️</span>
                  <div>
                    <p className="font-bold text-red-800">{t('bulk.selectAtLeastOneStep')}</p>
                    <p className="text-sm text-red-600">{t('bulk.selectStepInstructions')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </form>
      </Form>
    </div>
  );
}
