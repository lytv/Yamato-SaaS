# Product Step Crosstab - Next.js Implementation Plan

## Overview
Implement Product Step Crosstab feature within the existing Yamato-SaaS Next.js architecture using Drizzle ORM, Clerk authentication, and modern React patterns. This feature displays production step pricing data in multiple view formats (Table, Cards, Pivot) with advanced filtering and export capabilities.

## Project Context
- **Framework**: Next.js 14 with App Router + TypeScript
- **Database**: PostgreSQL with Drizzle ORM (NOT raw SQL/stored procedures)
- **Authentication**: Clerk with multi-tenancy (orgId/userId)
- **UI Library**: Shadcn UI + Tailwind CSS
- **State Management**: React hooks pattern
- **Testing**: Vitest + Playwright

## Database Schema Analysis
Current tables (from Schema.ts):
```typescript
// product: id, ownerId, productCode, productName, category, notes
// production_step: id, ownerId, stepCode, stepName, filmSequence, stepGroup, notes  
// production_step_detail: id, ownerId, productId, productionStepId, sequenceNumber, factoryPrice, calculatedPrice, ...
```

## Implementation Plan

### Phase 1: Database Query Layer (Day 1)

#### 1.1 Create Product Step Crosstab Query Function
**File**: `src/libs/queries/productStepCrosstab.ts`

```typescript
/**
 * Product Step Crosstab database queries using Drizzle ORM
 * Replaces the stored procedure approach with type-safe Drizzle queries
 */

import { and, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { 
  productSchema, 
  productionStepSchema, 
  productionStepDetailSchema 
} from '@/models/Schema';

export type PriceType = 'factory' | 'calculated';

export interface ProductStepCrosstabParams {
  ownerId: string;
  productCode?: string;
  priceType: PriceType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductStepCrosstabResult {
  productCode: string;
  productName: string;
  steps: {
    stepCode: string;
    stepName: string;
    price: string;
    sequenceNumber: number;
  }[];
}

export async function getProductStepCrosstab(
  params: ProductStepCrosstabParams
): Promise<ProductStepCrosstabResult[]> {
  const { 
    ownerId, 
    productCode, 
    priceType, 
    search, 
    page = 1, 
    limit = 50 
  } = params;
  
  const offset = (page - 1) * limit;
  const priceColumn = priceType === 'factory' ? 'factoryPrice' : 'calculatedPrice';

  // Build where conditions
  let whereConditions = eq(productSchema.ownerId, ownerId);
  
  if (productCode) {
    whereConditions = and(
      whereConditions, 
      eq(productSchema.productCode, productCode)
    ) || whereConditions;
  }
  
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(productSchema.ownerId, ownerId),
      or(
        ilike(productSchema.productName, searchTerm),
        ilike(productSchema.productCode, searchTerm),
        ilike(productionStepSchema.stepName, searchTerm),
        ilike(productionStepSchema.stepCode, searchTerm)
      )
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Execute join query
  const results = await db
    .select({
      productCode: productSchema.productCode,
      productName: productSchema.productName,
      stepCode: productionStepSchema.stepCode,
      stepName: productionStepSchema.stepName,
      factoryPrice: productionStepDetailSchema.factoryPrice,
      calculatedPrice: productionStepDetailSchema.calculatedPrice,
      sequenceNumber: productionStepDetailSchema.sequenceNumber,
    })
    .from(productSchema)
    .innerJoin(
      productionStepDetailSchema, 
      eq(productSchema.id, productionStepDetailSchema.productId)
    )
    .innerJoin(
      productionStepSchema, 
      eq(productionStepDetailSchema.productionStepId, productionStepSchema.id)
    )
    .where(whereConditions)
    .orderBy(
      productSchema.productCode, 
      productionStepDetailSchema.sequenceNumber
    )
    .limit(limit)
    .offset(offset);

  // Transform results to grouped format
  const groupedResults = results.reduce((acc, row) => {
    const existing = acc.find(item => item.productCode === row.productCode);
    const price = row[priceColumn] || '0';
    
    const step = {
      stepCode: row.stepCode,
      stepName: row.stepName,
      price: price.toString(),
      sequenceNumber: row.sequenceNumber,
    };

    if (existing) {
      existing.steps.push(step);
    } else {
      acc.push({
        productCode: row.productCode,
        productName: row.productName,
        steps: [step],
      });
    }
    
    return acc;
  }, [] as ProductStepCrosstabResult[]);

  return groupedResults;
}

export async function getProductStepCrosstabCount(
  params: ProductStepCrosstabParams
): Promise<number> {
  // Implementation similar to above but with count()
  // Returns total number of unique products matching criteria
}

export async function getProductCodesForCrosstab(
  ownerId: string, 
  search?: string
): Promise<string[]> {
  // Returns distinct product codes for search autocomplete
  const whereConditions = eq(productSchema.ownerId, ownerId);
  
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      whereConditions,
      ilike(productSchema.productCode, searchTerm)
    );
    whereConditions = searchCondition || whereConditions;
  }

  const results = await db
    .selectDistinct({ productCode: productSchema.productCode })
    .from(productSchema)
    .where(whereConditions)
    .orderBy(productSchema.productCode)
    .limit(20);

  return results.map(r => r.productCode);
}
```

#### 1.2 Create Data Transformation Utilities
**File**: `src/utils/productStepCrosstabTransforms.ts`

```typescript
import type { ProductStepCrosstabResult } from '@/libs/queries/productStepCrosstab';

export type ViewMode = 'table' | 'cards' | 'pivot';

// Transform data for table view (flat structure)
export function transformToTableView(data: ProductStepCrosstabResult[]) {
  const tableRows = [];
  
  data.forEach(product => {
    product.steps.forEach(step => {
      tableRows.push({
        productCode: product.productCode,
        productName: product.productName,
        stepCode: step.stepCode,
        stepName: step.stepName,
        price: step.price,
        sequenceNumber: step.sequenceNumber,
      });
    });
  });
  
  return tableRows;
}

// Transform data for card view (grouped by product)
export function transformToCardView(data: ProductStepCrosstabResult[]) {
  return data.map(product => ({
    productCode: product.productCode,
    productName: product.productName,
    stepCount: product.steps.length,
    totalPrice: product.steps.reduce((sum, step) => 
      sum + parseFloat(step.price || '0'), 0
    ),
    steps: product.steps.sort((a, b) => a.sequenceNumber - b.sequenceNumber),
  }));
}

// Transform data for pivot view (crosstab matrix)
export function transformToPivotView(data: ProductStepCrosstabResult[]) {
  // Get all unique step codes across all products
  const allStepCodes = new Set<string>();
  data.forEach(product => {
    product.steps.forEach(step => {
      allStepCodes.add(step.stepCode);
    });
  });
  
  const sortedStepCodes = Array.from(allStepCodes).sort();
  
  // Create pivot matrix
  const pivotData = data.map(product => {
    const row: any = {
      productCode: product.productCode,
      productName: product.productName,
    };
    
    let totalPrice = 0;
    
    sortedStepCodes.forEach(stepCode => {
      const step = product.steps.find(s => s.stepCode === stepCode);
      if (step) {
        row[stepCode] = {
          price: step.price,
          stepName: step.stepName,
        };
        totalPrice += parseFloat(step.price || '0');
      } else {
        row[stepCode] = null;
      }
    });
    
    row.totalPrice = totalPrice;
    return row;
  });
  
  return {
    columns: sortedStepCodes,
    data: pivotData,
  };
}
```

### Phase 2: API Routes Implementation (Day 2)

#### 2.1 Main Crosstab API Route
**File**: `src/app/api/product-step-crosstab/route.ts`

```typescript
/**
 * Product Step Crosstab API Routes - GET
 * Following Yamato-SaaS patterns with Clerk auth and validation
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { 
  getProductStepCrosstab, 
  getProductStepCrosstabCount 
} from '@/libs/queries/productStepCrosstab';
import { validateProductStepCrosstabParams } from '@/libs/validations/productStepCrosstab';
import { 
  transformToTableView, 
  transformToCardView, 
  transformToPivotView 
} from '@/utils/productStepCrosstabTransforms';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const queryParams = {
      productCode: searchParams.get('productCode') || undefined,
      priceType: searchParams.get('priceType') || 'factory',
      viewMode: searchParams.get('viewMode') || 'table',
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    const validatedParams = validateProductStepCrosstabParams(queryParams);

    const paramsWithOwner = {
      ...validatedParams,
      ownerId: orgId || userId,
    };

    const [rawData, total] = await Promise.all([
      getProductStepCrosstab(paramsWithOwner),
      getProductStepCrosstabCount(paramsWithOwner),
    ]);

    // Transform data based on view mode
    let transformedData;
    switch (validatedParams.viewMode) {
      case 'cards':
        transformedData = transformToCardView(rawData);
        break;
      case 'pivot':
        transformedData = transformToPivotView(rawData);
        break;
      default:
        transformedData = transformToTableView(rawData);
    }

    return Response.json({
      success: true,
      data: transformedData,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        hasMore: (validatedParams.page * validatedParams.limit) < total,
      },
      meta: {
        viewMode: validatedParams.viewMode,
        priceType: validatedParams.priceType,
        filters: {
          productCode: validatedParams.productCode,
          search: validatedParams.search,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching product step crosstab:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid parameters', 
          code: 'VALIDATION_ERROR', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

#### 2.2 Product Codes API Route  
**File**: `src/app/api/product-step-crosstab/product-codes/route.ts`

```typescript
/**
 * Product codes API for crosstab search autocomplete
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

import { getProductCodesForCrosstab } from '@/libs/queries/productStepCrosstab';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || undefined;

    const productCodes = await getProductCodesForCrosstab(
      orgId || userId, 
      search
    );

    return Response.json({
      success: true,
      data: productCodes,
    });
  } catch (error) {
    console.error('Error fetching product codes:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 2.3 Validation Schema
**File**: `src/libs/validations/productStepCrosstab.ts`

```typescript
/**
 * Product Step Crosstab validation schemas
 */

import { z } from 'zod';

export const productStepCrosstabParamsSchema = z.object({
  productCode: z.string().optional(),
  priceType: z.enum(['factory', 'calculated']).default('factory'),
  viewMode: z.enum(['table', 'cards', 'pivot']).default('table'),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export function validateProductStepCrosstabParams(data: unknown) {
  return productStepCrosstabParamsSchema.parse(data);
}

export type ProductStepCrosstabParams = z.infer<typeof productStepCrosstabParamsSchema>;
```

### Phase 3: React Hooks Implementation (Day 3)

#### 3.1 Main Hook for Product Step Crosstab
**File**: `src/hooks/useProductStepCrosstab.ts`

```typescript
/**
 * Product Step Crosstab custom hook
 * Following Yamato-SaaS hook patterns
 */

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';

import type { ViewMode } from '@/utils/productStepCrosstabTransforms';

export interface UseProductStepCrosstabParams {
  productCode?: string;
  priceType?: 'factory' | 'calculated';
  viewMode?: ViewMode;
  search?: string;
  page?: number;
  limit?: number;
}

export function useProductStepCrosstab(params: UseProductStepCrosstabParams = {}) {
  const { userId, orgId } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownerId = orgId || userId;

  const fetchData = useCallback(async () => {
    if (!ownerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (params.productCode) queryParams.set('productCode', params.productCode);
      if (params.priceType) queryParams.set('priceType', params.priceType);
      if (params.viewMode) queryParams.set('viewMode', params.viewMode);
      if (params.search) queryParams.set('search', params.search);
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());

      const response = await fetch(`/api/product-step-crosstab?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      setData(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    isLoading,
    error,
    refresh,
  };
}
```

#### 3.2 Filters Hook
**File**: `src/hooks/useProductStepCrosstabFilters.ts`

```typescript
/**
 * Product Step Crosstab filters hook
 */

import { useCallback, useState } from 'react';

import type { ViewMode } from '@/utils/productStepCrosstabTransforms';

export function useProductStepCrosstabFilters() {
  const [filters, setFilters] = useState({
    productCode: '',
    priceType: 'factory' as 'factory' | 'calculated',
    search: '',
    viewMode: 'table' as ViewMode,
    page: 1,
    limit: 50,
  });

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1, // Reset page when other filters change
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      productCode: '',
      priceType: 'factory',
      search: '',
      viewMode: 'table',
      page: 1,
      limit: 50,
    });
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
  };
}
```

### Phase 4: React Components Implementation (Day 4-5)

#### 4.1 Main Container Component
**File**: `src/features/productStepCrosstab/ProductStepCrosstabContainer.tsx`

```typescript
/**
 * Product Step Crosstab main container component
 * Following Yamato-SaaS component patterns
 */

import React from 'react';

import { useProductStepCrosstab } from '@/hooks/useProductStepCrosstab';
import { useProductStepCrosstabFilters } from '@/hooks/useProductStepCrosstabFilters';

import { ProductStepCrosstabFilters } from './ProductStepCrosstabFilters';
import { ProductStepCrosstabTable } from './ProductStepCrosstabTable';
import { ProductStepCrosstabCards } from './ProductStepCrosstabCards';
import { ProductStepCrosstabPivot } from './ProductStepCrosstabPivot';
import { ProductStepCrosstabSkeleton } from './ProductStepCrosstabSkeleton';

export function ProductStepCrosstabContainer() {
  const { filters, updateFilter, resetFilters } = useProductStepCrosstabFilters();
  
  const { data, pagination, isLoading, error, refresh } = useProductStepCrosstab({
    productCode: filters.productCode || undefined,
    priceType: filters.priceType,
    viewMode: filters.viewMode,
    search: filters.search || undefined,
    page: filters.page,
    limit: filters.limit,
  });

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.productCode) queryParams.set('productCode', filters.productCode);
      if (filters.priceType) queryParams.set('priceType', filters.priceType);
      if (filters.search) queryParams.set('search', filters.search);
      queryParams.set('export', 'true');

      const response = await fetch(`/api/product-step-crosstab/export?${queryParams}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `product-step-crosstab-${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (isLoading) {
    return <ProductStepCrosstabSkeleton />;
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-red-600">{error}</div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const renderView = () => {
    switch (filters.viewMode) {
      case 'cards':
        return <ProductStepCrosstabCards data={data} />;
      case 'pivot':
        return <ProductStepCrosstabPivot data={data} />;
      default:
        return <ProductStepCrosstabTable data={data} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Step Crosstab</h1>
          <p className="mt-1 text-sm text-gray-600">
            View production steps and pricing across products
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <ProductStepCrosstabFilters
        filters={filters}
        onFilterChange={updateFilter}
        onReset={resetFilters}
      />

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {data.length} results
        {pagination.total > 0 && (
          <span> of {pagination.total} total</span>
        )}
      </div>

      {/* Main Content */}
      {renderView()}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-center space-x-4">
          <button
            type="button"
            onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
            disabled={filters.page === 1}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {filters.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          
          <button
            type="button"
            onClick={() => updateFilter('page', filters.page + 1)}
            disabled={!pagination.hasMore}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

#### 4.2 Filters Component
**File**: `src/features/productStepCrosstab/ProductStepCrosstabFilters.tsx`

```typescript
/**
 * Product Step Crosstab filters component
 */

import { Search } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductStepCrosstabFiltersProps {
  filters: {
    productCode: string;
    priceType: 'factory' | 'calculated';
    search: string;
    viewMode: 'table' | 'cards' | 'pivot';
  };
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
}

export function ProductStepCrosstabFilters({
  filters,
  onFilterChange,
  onReset,
}: ProductStepCrosstabFiltersProps) {
  const [productCodeSuggestions, setProductCodeSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search for product code suggestions
  const debouncedProductCode = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (value.length > 0) {
          try {
            const response = await fetch(`/api/product-step-crosstab/product-codes?search=${value}`);
            const result = await response.json();
            if (result.success) {
              setProductCodeSuggestions(result.data);
              setShowSuggestions(true);
            }
          } catch (err) {
            console.error('Failed to fetch suggestions:', err);
          }
        } else {
          setShowSuggestions(false);
        }
      }, 300);
    };
  }, []);

  useEffect(() => {
    debouncedProductCode(filters.productCode);
  }, [filters.productCode, debouncedProductCode]);

  const viewModeButtons = [
    { id: 'table', label: 'Table' },
    { id: 'cards', label: 'Cards' },
    { id: 'pivot', label: 'Pivot' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Product Code with Autocomplete */}
        <div className="relative">
          <Label htmlFor="productCode">Product Code</Label>
          <div className="relative">
            <Input
              id="productCode"
              type="text"
              placeholder="Search product code..."
              value={filters.productCode}
              onChange={(e) => onFilterChange('productCode', e.target.value)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && productCodeSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {productCodeSuggestions.map((code) => (
                  <button
                    key={code}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50"
                    onClick={() => {
                      onFilterChange('productCode', code);
                      setShowSuggestions(false);
                    }}
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Price Type */}
        <div>
          <Label htmlFor="priceType">Price Type</Label>
          <select
            id="priceType"
            value={filters.priceType}
            onChange={(e) => onFilterChange('priceType', e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="factory">Factory Price</option>
            <option value="calculated">Calculated Price</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search steps, products..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>

        {/* View Mode */}
        <div>
          <Label>View Mode</Label>
          <div className="flex bg-gray-100 rounded-lg p-1 mt-1">
            {viewModeButtons.map((button) => (
              <button
                key={button.id}
                type="button"
                onClick={() => onFilterChange('viewMode', button.id)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  filters.viewMode === button.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reset Button */}
      {(filters.productCode || filters.search || filters.priceType !== 'factory') && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="text-sm"
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
```

#### 4.3 Table View Component
**File**: `src/features/productStepCrosstab/ProductStepCrosstabTable.tsx`

```typescript
/**
 * Product Step Crosstab table view component
 */

import React from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProductStepCrosstabTableProps {
  data: Array<{
    productCode: string;
    productName: string;
    stepCode: string;
    stepName: string;
    price: string;
    sequenceNumber: number;
  }>;
}

export function ProductStepCrosstabTable({ data }: ProductStepCrosstabTableProps) {
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(num);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Code</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Step Code</TableHead>
            <TableHead>Step Name</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-center">Sequence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={`${row.productCode}-${row.stepCode}-${index}`}>
              <TableCell className="font-medium">{row.productCode}</TableCell>
              <TableCell>{row.productName}</TableCell>
              <TableCell className="font-mono text-sm">{row.stepCode}</TableCell>
              <TableCell className="max-w-xs">
                <div className="whitespace-pre-line text-sm">{row.stepName}</div>
              </TableCell>
              <TableCell className="text-right font-semibold text-green-600">
                {formatCurrency(row.price)}
              </TableCell>
              <TableCell className="text-center text-sm text-gray-500">
                {row.sequenceNumber}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

#### 4.4 Cards View Component
**File**: `src/features/productStepCrosstab/ProductStepCrosstabCards.tsx`

```typescript
/**
 * Product Step Crosstab cards view component
 */

import React from 'react';

import { Badge } from '@/components/ui/badge';

interface ProductStepCrosstabCardsProps {
  data: Array<{
    productCode: string;
    productName: string;
    stepCount: number;
    totalPrice: number;
    steps: Array<{
      stepCode: string;
      stepName: string;
      price: string;
      sequenceNumber: number;
    }>;
  }>;
}

export function ProductStepCrosstabCards({ data }: ProductStepCrosstabCardsProps) {
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(num);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {data.map((product) => (
        <div
          key={product.productCode}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          {/* Card Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {product.productCode}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{product.productName}</p>
            </div>
            <Badge variant="secondary">
              {product.stepCount} Steps
            </Badge>
          </div>

          {/* Steps List */}
          <div className="space-y-3 mb-4">
            {product.steps.slice(0, 5).map((step) => (
              <div
                key={step.stepCode}
                className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-xs text-gray-500 font-mono mb-1">
                    {step.stepCode}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {step.stepName}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-green-600">
                    {formatCurrency(step.price)}
                  </div>
                </div>
              </div>
            ))}
            
            {product.steps.length > 5 && (
              <div className="text-center text-sm text-gray-500">
                +{product.steps.length - 5} more steps
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Value:</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(product.totalPrice)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### 4.5 Pivot View Component
**File**: `src/features/productStepCrosstab/ProductStepCrosstabPivot.tsx`

```typescript
/**
 * Product Step Crosstab pivot view component
 */

import React from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProductStepCrosstabPivotProps {
  data: {
    columns: string[];
    data: Array<{
      productCode: string;
      productName: string;
      totalPrice: number;
      [stepCode: string]: any;
    }>;
  };
}

export function ProductStepCrosstabPivot({ data }: ProductStepCrosstabPivotProps) {
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (!data.columns || data.data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-gray-50 min-w-[120px]">
                Product
              </TableHead>
              {data.columns.map((stepCode) => (
                <TableHead key={stepCode} className="text-center min-w-[100px]">
                  <div className="font-semibold">{stepCode}</div>
                  {/* Show step name if available */}
                  {data.data[0]?.[stepCode]?.stepName && (
                    <div className="text-xs font-normal text-gray-600 mt-1">
                      {data.data[0][stepCode].stepName.split('\n')[0]}
                    </div>
                  )}
                </TableHead>
              ))}
              <TableHead className="text-right font-bold">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((row) => (
              <TableRow key={row.productCode}>
                <TableCell className="sticky left-0 bg-white font-medium">
                  <div>{row.productCode}</div>
                  <div className="text-xs text-gray-500">{row.productName}</div>
                </TableCell>
                {data.columns.map((stepCode) => (
                  <TableCell key={stepCode} className="text-center">
                    {row[stepCode] ? (
                      <span className="font-semibold text-green-600">
                        {formatCurrency(row[stepCode].price)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold">
                  {formatCurrency(row.totalPrice)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

### Phase 5: Page Integration (Day 6)

#### 5.1 Dashboard Page
**File**: `src/app/[locale]/(auth)/dashboard/product-step-crosstab/page.tsx`

```typescript
/**
 * Product Step Crosstab page
 * Following Yamato-SaaS page patterns
 */

import type { Metadata } from 'next';
import React from 'react';

import { DashboardHeader } from '@/features/dashboard/DashboardHeader';
import { ProductStepCrosstabContainer } from '@/features/productStepCrosstab/ProductStepCrosstabContainer';

export const metadata: Metadata = {
  title: 'Product Step Crosstab',
  description: 'View production steps and pricing across products',
};

export default function ProductStepCrosstabPage() {
  return (
    <>
      <DashboardHeader
        title="Product Step Crosstab"
        description="View production steps and pricing across products"
      />
      <ProductStepCrosstabContainer />
    </>
  );
}
```

### Phase 6: Testing & Export Features (Day 7)

#### 6.1 Export API Route
**File**: `src/app/api/product-step-crosstab/export/route.ts`

```typescript
/**
 * Product Step Crosstab export API route
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';

import { getProductStepCrosstab } from '@/libs/queries/productStepCrosstab';
import { transformToTableView } from '@/utils/productStepCrosstabTransforms';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    const productCode = url.searchParams.get('productCode') || undefined;
    const priceType = url.searchParams.get('priceType') as 'factory' | 'calculated' || 'factory';
    const search = url.searchParams.get('search') || undefined;

    const rawData = await getProductStepCrosstab({
      ownerId: orgId || userId,
      productCode,
      priceType,
      search,
      page: 1,
      limit: 10000, // Large limit for export
    });

    const tableData = transformToTableView(rawData);
    
    const worksheet = XLSX.utils.json_to_sheet(
      tableData.map(row => ({
        'Product Code': row.productCode,
        'Product Name': row.productName,
        'Step Code': row.stepCode,
        'Step Name': row.stepName,
        'Price': parseFloat(row.price),
        'Sequence': row.sequenceNumber,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Steps');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="product-step-crosstab-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response('Export failed', { status: 500 });
  }
}
```

#### 6.2 Component Tests
**File**: `src/features/productStepCrosstab/__tests__/ProductStepCrosstabContainer.test.tsx`

```typescript
/**
 * Product Step Crosstab container tests
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProductStepCrosstabContainer } from '../ProductStepCrosstabContainer';

// Mock hooks
vi.mock('@/hooks/useProductStepCrosstab', () => ({
  useProductStepCrosstab: () => ({
    data: [],
    pagination: { page: 1, limit: 50, total: 0, hasMore: false },
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/useProductStepCrosstabFilters', () => ({
  useProductStepCrosstabFilters: () => ({
    filters: {
      productCode: '',
      priceType: 'factory',
      search: '',
      viewMode: 'table',
      page: 1,
      limit: 50,
    },
    updateFilter: vi.fn(),
    resetFilters: vi.fn(),
  }),
}));

describe('ProductStepCrosstabContainer', () => {
  it('renders the container with header', () => {
    render(<ProductStepCrosstabContainer />);
    
    expect(screen.getByRole('heading', { name: /product step crosstab/i })).toBeInTheDocument();
    expect(screen.getByText(/view production steps and pricing/i)).toBeInTheDocument();
  });

  it('renders export button', () => {
    render(<ProductStepCrosstabContainer />);
    
    expect(screen.getByRole('button', { name: /export excel/i })).toBeInTheDocument();
  });
});
```

### Phase 7: Navigation & Documentation (Day 8)

#### 7.1 Add to Dashboard Navigation
Update the dashboard layout to include the new page link.

#### 7.2 Type Definitions
**File**: `src/types/productStepCrosstab.ts`

```typescript
/**
 * Product Step Crosstab type definitions
 */

export interface ProductStepCrosstab {
  productCode: string;
  productName: string;
  steps: ProductStepDetail[];
}

export interface ProductStepDetail {
  stepCode: string;
  stepName: string;
  price: string;
  sequenceNumber: number;
}

export type PriceType = 'factory' | 'calculated';
export type ViewMode = 'table' | 'cards' | 'pivot';

export interface ProductStepCrosstabFilters {
  productCode?: string;
  priceType: PriceType;
  search?: string;
  viewMode: ViewMode;
  page: number;
  limit: number;
}
```

## Key Differences from Original Plan

1. **No Stored Procedures**: Using Drizzle ORM joins instead of raw SQL
2. **Clerk Authentication**: Multi-tenancy with orgId/userId pattern
3. **Next.js App Router**: File-based routing with TypeScript
4. **Shadcn UI**: Pre-built components instead of custom Tailwind
5. **Feature-based Structure**: Components organized by feature
6. **Testing Integration**: Vitest for unit tests, following existing patterns

## Testing Strategy
- Unit tests for hooks and utilities
- Component tests for UI components
- Integration tests for API routes
- E2E tests for complete user workflows

## Success Criteria
- ✅ Displays production step data in 3 view modes
- ✅ Advanced filtering and search functionality  
- ✅ Excel export capability
- ✅ Responsive design with Shadcn UI
- ✅ Type-safe implementation with TypeScript
- ✅ Multi-tenant support with Clerk
- ✅ Follows existing Yamato-SaaS patterns
- ✅ Comprehensive test coverage

This plan leverages the existing Yamato-SaaS architecture and provides a production-ready implementation that matches the project's high standards for code quality and user experience.
