'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import React, { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { MultiAssignConfig } from '@/features/productionStep/MultiAssignConfigForm';
import { MultiAssignConfigForm } from '@/features/productionStep/MultiAssignConfigForm';
import { MultiAssignPreview } from '@/features/productionStep/MultiAssignPreview';
import { MultiAssignProgress } from '@/features/productionStep/MultiAssignProgress';
import { ProductMultiSelect } from '@/features/productionStep/ProductMultiSelect';
import { StepMultiSelect } from '@/features/productionStep/StepMultiSelect';
import { useProductionSteps } from '@/hooks/useProductionSteps';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/product';
import type { ProductionStep } from '@/types/productionStep';

export default function MultiAssignPage() {
  // Get authentication context for ownerId
  const { userId, orgId } = useAuth();
  const ownerId = orgId || userId || '';

  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<ProductionStep[]>([]);
  const [config, setConfig] = useState<MultiAssignConfig>({ sequenceStart: 1, autoIncrement: true, isFinalStep: false, isVtStep: false, isParkingStep: false });
  const [progress, setProgress] = useState({
    total: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    currentChunk: 0,
    totalChunks: 0,
    status: 'idle' as 'idle' | 'processing' | 'done' | 'error',
  });
  const [selectAllProducts, setSelectAllProducts] = useState(false);
  const [selectAllSteps, setSelectAllSteps] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [stepPage, setStepPage] = useState(1);
  const [stepSearch, setStepSearch] = useState('');
  const [stepGroup, setStepGroup] = useState('');

  const { products, pagination: productPagination, isLoading: loadingProducts } = useProducts({
    page: productPage,
    search: productSearch,
    ownerId,
  });
  const { productionSteps, pagination: stepPagination, isLoading: loadingSteps } = useProductionSteps({
    page: stepPage,
    search: stepSearch,
    ownerId,
  });

  const t = useTranslations('productionStepDetail.bulkAdd');

  // Memoize config onChange để tránh unnecessary re-renders
  const handleConfigChange = useCallback((newConfig: MultiAssignConfig) => {
    setConfig(newConfig);
  }, []);

  const handleSelectAllProducts = () => {
    if (selectAllProducts) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products);
    }
    setSelectAllProducts(!selectAllProducts);
  };
  const handleSelectAllSteps = () => {
    if (selectAllSteps) {
      setSelectedSteps([]);
    } else {
      setSelectedSteps(productionSteps);
    }
    setSelectAllSteps(!selectAllSteps);
  };

  async function handleBulkAssign() {
    setProgress({
      total: selectedProducts.length * selectedSteps.length,
      created: 0,
      skipped: 0,
      failed: 0,
      currentChunk: 0,
      totalChunks: 0,
      status: 'processing',
    });
    try {
      // Clean up config data để phù hợp với API schema
      const cleanConfig = {
        sequenceStart: config.sequenceStart || 1,
        autoIncrement: config.autoIncrement ?? true,
        ...(config.factoryPrice && config.factoryPrice.trim() && { factoryPrice: config.factoryPrice.trim() }),
        ...(config.calculatedPrice && config.calculatedPrice.trim() && { calculatedPrice: config.calculatedPrice.trim() }),
        ...(typeof config.quantityLimit1 === 'number' && !Number.isNaN(config.quantityLimit1) && { quantityLimit1: config.quantityLimit1 }),
        ...(typeof config.quantityLimit2 === 'number' && !Number.isNaN(config.quantityLimit2) && { quantityLimit2: config.quantityLimit2 }),
        isFinalStep: config.isFinalStep ?? false,
        isVtStep: config.isVtStep ?? false,
        isParkingStep: config.isParkingStep ?? false,
      };

      // console.log('Request data:', {
      //   productIds: selectedProducts.map(p => p.id),
      //   productionStepIds: selectedSteps.map(s => s.id),
      //   defaultValues: cleanConfig,
      // });

      const res = await fetch('/api/production-step-details/multi-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProducts.map(p => p.id),
          productionStepIds: selectedSteps.map(s => s.id),
          defaultValues: cleanConfig,
        }),
      });

      const data = await res.json();
      // console.log('Response data:', data);

      if (!res.ok) {
        throw new Error(data.error || `API Error: ${res.status}`);
      }
      setProgress({
        total: data.summary.totalRequested,
        created: data.summary.created,
        skipped: data.summary.skipped,
        failed: data.summary.failed,
        currentChunk: data.summary.created + data.summary.skipped + data.summary.failed,
        totalChunks: 1,
        status: data.success ? 'done' : 'error',
      });
    } catch {
      setProgress(p => ({ ...p, status: 'error' }));
    }
  }

  function handleReset() {
    setSelectedProducts([]);
    setSelectedSteps([]);
    setConfig({ sequenceStart: 1, autoIncrement: true, isFinalStep: false, isVtStep: false, isParkingStep: false });
    setProgress({
      total: 0,
      created: 0,
      skipped: 0,
      failed: 0,
      currentChunk: 0,
      totalChunks: 0,
      status: 'idle',
    });
    setSelectAllProducts(false);
    setSelectAllSteps(false);
  }

  function handleCancel() {
    handleReset();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <h1 className="mb-2 text-2xl font-bold">{t('title', { default: '🗂️ Bulk Add Production Step Details' })}</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Products Selection */}
        <div className="rounded border bg-white p-4">
          <h2 className="mb-2 font-semibold">{t('productsSelection', { default: 'Products Selection' })}</h2>
          <div className="mb-2 flex gap-2">
            <input
              className="w-full rounded border px-2 py-1"
              placeholder={t('searchProducts', { default: '🔍 Search products...' })}
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setProductPage(1);
              }}
            />
            <select
              className="rounded border px-2 py-1"
              value={productCategory}
              onChange={(e) => {
                setProductCategory(e.target.value);
                setProductPage(1);
              }}
            >
              <option value="">{t('categoryFilter', { default: '🏷️ Category Filter ▼' })}</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={selectAllProducts} onChange={handleSelectAllProducts} />
              {t('selectAllProducts', { default: 'Select All Products (this page)' })}
            </label>
          </div>
          <div className="mb-2 min-h-[120px]">
            {loadingProducts
              ? (
                  <div>Đang tải sản phẩm...</div>
                )
              : products.length === 0
                ? (
                    <div>Không có sản phẩm</div>
                  )
                : (
                    <ProductMultiSelect
                      products={products}
                      selected={selectedProducts}
                      onChange={setSelectedProducts}
                      page={productPage}
                      totalPages={productPagination ? Math.ceil(productPagination.total / productPagination.limit) : 1}
                      onPageChange={setProductPage}
                    />
                  )}
          </div>
          {/* Pagination */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button type="button" onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={productPage === 1}>Prev</button>
            <span>
              Trang
              {productPage}
            </span>
            <button type="button" onClick={() => setProductPage(p => (productPagination?.hasMore ? p + 1 : p))} disabled={!productPagination?.hasMore}>Next</button>
            {productPagination && (
              <span>
                (
                {productPagination.page * productPagination.limit - productPagination.limit + 1}
                -
                {Math.min(productPagination.page * productPagination.limit, productPagination.total)}
                /
                {' '}
                {productPagination.total}
                )
              </span>
            )}
          </div>
        </div>
        {/* Steps Selection */}
        <div className="rounded border bg-white p-4">
          <h2 className="mb-2 font-semibold">{t('stepsSelection', { default: 'Steps Selection' })}</h2>
          <div className="mb-2 flex gap-2">
            <input
              className="w-full rounded border px-2 py-1"
              placeholder={t('searchSteps', { default: '🔍 Search steps...' })}
              value={stepSearch}
              onChange={(e) => {
                setStepSearch(e.target.value);
                setStepPage(1);
              }}
            />
            <select
              className="rounded border px-2 py-1"
              value={stepGroup}
              onChange={(e) => {
                setStepGroup(e.target.value);
                setStepPage(1);
              }}
            >
              <option value="">{t('groupFilter', { default: '🏷️ Group Filter ▼' })}</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={selectAllSteps} onChange={handleSelectAllSteps} />
              {t('selectAllSteps', { default: 'Select All Steps (this page)' })}
            </label>
          </div>
          <div className="mb-2 min-h-[120px]">
            {loadingSteps
              ? (
                  <div>Đang tải công đoạn...</div>
                )
              : productionSteps.length === 0
                ? (
                    <div>Không có công đoạn</div>
                  )
                : (
                    <StepMultiSelect
                      steps={productionSteps}
                      selected={selectedSteps}
                      onChange={setSelectedSteps}
                      page={stepPage}
                      totalPages={stepPagination ? Math.ceil(stepPagination.total / stepPagination.limit) : 1}
                      onPageChange={setStepPage}
                    />
                  )}
          </div>
          {/* Pagination */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button type="button" onClick={() => setStepPage(p => Math.max(1, p - 1))} disabled={stepPage === 1}>Prev</button>
            <span>
              Trang
              {stepPage}
            </span>
            <button type="button" onClick={() => setStepPage(p => (stepPagination?.hasMore ? p + 1 : p))} disabled={!stepPagination?.hasMore}>Next</button>
            {stepPagination && (
              <span>
                (
                {stepPagination.page * stepPagination.limit - stepPagination.limit + 1}
                -
                {Math.min(stepPagination.page * stepPagination.limit, stepPagination.total)}
                /
                {' '}
                {stepPagination.total}
                )
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Assignment Configuration */}
      <div className="mt-4 rounded border bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold">{t('assignmentConfig', { default: '🎯 Assignment Configuration' })}</h3>
        <MultiAssignConfigForm initialValues={config} onChange={handleConfigChange} />
      </div>
      {/* Preview & Actions */}
      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="font-medium">
            {t('preview', { default: '📊 Preview:' })}
            {' '}
            {selectedProducts.length}
            {' '}
            {t('products', { default: 'Products' })}
            {' × '}
            {selectedSteps.length}
            {' '}
            {t('steps', { default: 'Steps' })}
            {' = '}
            {selectedProducts.length * selectedSteps.length}
            {' '}
            {t('assignments', { default: 'Assignments' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a href="/dashboard/production-step-details">
            <Button variant="outline">{t('back', { default: '← Back to Production Step Details' })}</Button>
          </a>
          <Button variant="outline" onClick={handleCancel}>{t('cancel', { default: 'Cancel' })}</Button>
          <Button variant="outline" onClick={handleReset}>{t('reset', { default: 'Reset' })}</Button>
          <Button className="bg-green-600 text-white" onClick={handleBulkAssign} disabled={selectedProducts.length === 0 || selectedSteps.length === 0 || progress.status === 'processing'}>
            <span className="mr-2">💾</span>
            {' '}
            {t('createAssignments', { default: 'Create Assignments' })}
          </Button>
        </div>
      </div>
      <div>
        <MultiAssignPreview
          selectedProducts={selectedProducts}
          selectedSteps={selectedSteps}
        />
      </div>
      <div>
        <MultiAssignProgress {...progress} />
      </div>
    </div>
  );
}
