/**
 * Production Progress Pivot database queries
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Using stored procedure sp_production_progress_pivot
 */

import { sql } from 'drizzle-orm';

import {
  validateProductionProgressPivotItem,
  validateProductionProgressPivotSummary,
} from '@/libs/validations/productionProgressPivot';
import type {
  ProductionProgressPivotFilterOptions,
  ProductionProgressPivotFiltersWithOwner,
  ProductionProgressPivotItem,
  ProductionProgressPivotSummary,
} from '@/types/productionProgressPivot';

import { db } from '../DB';

/**
 * Get production progress pivot data using stored procedure
 * @param params - Query parameters including filters and pagination
 * @returns Promise resolving to production progress pivot data with pagination
 */
export async function getProductionProgressPivot(
  params: ProductionProgressPivotFiltersWithOwner,
): Promise<{
    data: ProductionProgressPivotItem[];
    summary: ProductionProgressPivotSummary;
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }> {
  const {
    product_code,
    plan_code,
    search,
    page = 1,
    limit = 20,
    sortBy = 'product_code',
    sortOrder = 'asc',
  } = params;

  try {
    // Call new dynamic stored procedure with parameters
    const rawResults = await db.execute(sql`
      SELECT * FROM sp_production_progress_pivot_dynamic(
        ${product_code || null},
        ${plan_code || null}
      )
    `);

    // Validate and transform raw results
    let validatedData: ProductionProgressPivotItem[] = [];

    if (rawResults.rows && rawResults.rows.length > 0) {
      validatedData = rawResults.rows.map((row: any) => {
        // Parse JSON step data and convert to fixed format for backward compatibility
        const stepData = row.step_data || {};

        // Sort step codes by numeric value after 'cd' prefix for proper ordering (cd01, cd02, cd10, cd20)
        const stepKeys = Object.keys(stepData).sort((a, b) => {
          // Extract numeric part from step codes like 'cd01', 'cd02', etc.
          const getNumericPart = (code: string) => {
            const match = code.match(/\d+/);
            return match ? Number.parseInt(match[0], 10) : 0;
          };
          return getNumericPart(a) - getNumericPart(b);
        });

        // Create the item with base data
        const item: any = {
          product_code: row.product_code,
          product_name: row.product_name,
          plan_code: row.plan_code,
          plan_name: row.plan_name,
          planned_quantity: Number(row.planned_quantity) || 0,
          total_completed: Number(row.total_completed) || 0,
          completion_rate: Number(row.completion_rate) || 0,
        };

        // Initialize all step columns to null/0 first
        for (let i = 1; i <= 150; i++) {
          item[`step_code_${i}`] = null;
          item[`step_name_${i}`] = null;
          item[`step_quantity_${i}`] = 0;
        }

        // Now assign actual step data to correct positions based on sorted order
        stepKeys.forEach((stepKey, index) => {
          const stepInfo = stepData[stepKey];
          if (stepInfo && typeof stepInfo === 'object') {
            const columnIndex = index + 1; // 1-based indexing
            if (columnIndex <= 150) {
              item[`step_code_${columnIndex}`] = stepInfo.step_code || null;
              item[`step_name_${columnIndex}`] = stepInfo.step_name || null;
              item[`step_quantity_${columnIndex}`] = Number(stepInfo.quantity) || 0;
            }
          }
        });

        return validateProductionProgressPivotItem(item);
      });
    }

    // Apply search filter if provided
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase().trim();
      validatedData = validatedData.filter((item) => {
        // Search in basic fields
        if (item.product_code.toLowerCase().includes(searchTerm)
          || item.product_name.toLowerCase().includes(searchTerm)
          || item.plan_code.toLowerCase().includes(searchTerm)
          || item.plan_name.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // Search in all dynamic step names
        for (let i = 1; i <= 150; i++) {
          const stepName = (item as any)[`step_name_${i}`];
          if (stepName && stepName.toLowerCase().includes(searchTerm)) {
            return true;
          }
        }

        return false;
      });
    }

    // Apply sorting
    validatedData.sort((a, b) => {
      const aValue = a[sortBy as keyof ProductionProgressPivotItem];
      const bValue = b[sortBy as keyof ProductionProgressPivotItem];

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Calculate summary statistics
    const summary = calculateSummaryStatistics(validatedData);

    // Apply pagination
    const total = validatedData.length;
    const offset = (page - 1) * limit;
    const paginatedData = validatedData.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      data: paginatedData,
      summary,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    };
  } catch (error) {
    console.error('Error fetching production progress pivot:', error);
    throw new Error('Failed to fetch production progress pivot data');
  }
}

/**
 * Calculate summary statistics from production progress pivot data
 * @param data - Array of production progress pivot items
 * @returns Summary statistics
 */
function calculateSummaryStatistics(
  data: ProductionProgressPivotItem[],
): ProductionProgressPivotSummary {
  if (data.length === 0) {
    return {
      total_records: 0,
      total_planned: 0,
      total_completed: 0,
      average_completion_rate: 0,
      products_count: 0,
      plans_count: 0,
    };
  }

  const uniqueProducts = new Set(data.map(item => item.product_code));
  const uniquePlans = new Set(data.map(item => item.plan_code));

  const totalPlanned = data.reduce((sum, item) => sum + item.planned_quantity, 0);
  const totalCompleted = data.reduce((sum, item) => sum + item.total_completed, 0);
  const averageCompletionRate = data.reduce((sum, item) => sum + item.completion_rate, 0) / data.length;

  return validateProductionProgressPivotSummary({
    total_records: data.length,
    total_planned: totalPlanned,
    total_completed: totalCompleted,
    average_completion_rate: Math.round(averageCompletionRate * 100) / 100,
    products_count: uniqueProducts.size,
    plans_count: uniquePlans.size,
  });
}

/**
 * Get filter options for dropdowns
 * @returns Promise resolving to filter options
 */
export async function getProductionProgressPivotFilterOptions(): Promise<ProductionProgressPivotFilterOptions> {
  try {
    // Get all unique values from the dynamic stored procedure result
    const rawResults = await db.execute(sql`
      SELECT DISTINCT
        product_code,
        product_name,
        plan_code,
        plan_name,
        step_data
      FROM sp_production_progress_pivot_dynamic(NULL, NULL)
      ORDER BY product_code, plan_code
    `);

    const plans = new Map<string, string>();
    const products = new Map<string, string>();
    const steps = new Map<string, string>();

    if (rawResults.rows) {
      rawResults.rows.forEach((row: any) => {
        if (row.product_code) {
          products.set(row.product_code, row.product_name || row.product_code);
        }
        if (row.plan_code) {
          plans.set(row.plan_code, row.plan_name || row.plan_code);
        }

        // Parse JSON step data to collect all step codes and names
        if (row.step_data) {
          const stepData = row.step_data || {};
          Object.keys(stepData).forEach((stepCode) => {
            const stepInfo = stepData[stepCode];
            if (stepInfo && typeof stepInfo === 'object' && stepInfo.step_name) {
              steps.set(stepCode, stepInfo.step_name);
            }
          });
        }
      });
    }

    return {
      plans: Array.from(plans.entries()).map(([code, name]) => ({ code, name })),
      products: Array.from(products.entries()).map(([code, name]) => ({ code, name })),
      steps: Array.from(steps.entries()).map(([code, name]) => ({ code, name })),
    };
  } catch (error) {
    console.error('Error fetching pivot filter options:', error);
    throw new Error('Failed to fetch pivot filter options');
  }
}

/**
 * Export production progress pivot data
 * @param params - Export parameters including filters
 * @returns Promise resolving to all filtered data for export
 */
export async function exportProductionProgressPivot(
  params: ProductionProgressPivotFiltersWithOwner,
): Promise<ProductionProgressPivotItem[]> {
  // Get all data without pagination for export
  const result = await getProductionProgressPivot({
    ...params,
    page: 1,
    limit: 10000, // Large limit to get all data
  });

  return result.data;
}
