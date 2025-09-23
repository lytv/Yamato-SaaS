/**
 * Production Progress Report database queries
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Using stored procedure sp_production_progress_report
 */

import { sql } from 'drizzle-orm';

import {
  validateProductionProgressReportItem,
  validateProductionProgressReportSummary,
} from '@/libs/validations/productionProgressReport';
import type {
  ProductionProgressReportFilterOptions,
  ProductionProgressReportFiltersWithOwner,
  ProductionProgressReportItem,
  ProductionProgressReportSummary,
} from '@/types/productionProgressReport';

import { db } from '../DB';

/**
 * Get production progress report data using stored procedure
 * @param params - Query parameters including filters and pagination
 * @returns Promise resolving to production progress data with pagination
 */
export async function getProductionProgressReport(
  params: ProductionProgressReportFiltersWithOwner,
): Promise<{
    data: ProductionProgressReportItem[];
    summary: ProductionProgressReportSummary;
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }> {
  const {
    plan_code,
    product_code,
    production_step_code,
    report_type = 'ALL',
    search,
    page = 1,
    limit = 20,
    sortBy = 'plan_code',
    sortOrder = 'asc',
  } = params;

  try {
    // Call stored procedure with parameters
    const rawResults = await db.execute(sql`
      SELECT * FROM sp_production_progress_report(
        ${plan_code || null},
        ${product_code || null},
        ${production_step_code || null}
      )
    `);

    // Validate and transform raw results
    let validatedData: ProductionProgressReportItem[] = [];

    if (rawResults.rows && rawResults.rows.length > 0) {
      validatedData = rawResults.rows.map((row: any) => {
        return validateProductionProgressReportItem({
          report_type: row.report_type,
          entity_id: row.entity_id,
          entity_name: row.entity_name,
          plan_code: row.plan_code,
          product_code: row.product_code,
          product_name: row.product_name,
          step_code: row.step_code,
          step_name: row.step_name,
          total_planned: Number(row.total_planned) || 0,
          total_actual: Number(row.total_actual) || 0,
          total_assigned: Number(row.total_assigned) || 0,
          total_received: Number(row.total_received) || 0,
          total_defect: Number(row.total_defect) || 0,
          total_made: Number(row.total_made) || 0,
          completion_rate: Number(row.completion_rate) || 0,
          remaining_quantity: Number(row.remaining_quantity) || 0,
        });
      });
    }

    // Filter by report type if specified
    if (report_type !== 'ALL') {
      validatedData = validatedData.filter(item => item.report_type === report_type);
    }

    // Apply search filter if provided
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase().trim();
      validatedData = validatedData.filter(item =>
        item.entity_name.toLowerCase().includes(searchTerm)
        || item.plan_code.toLowerCase().includes(searchTerm)
        || item.product_code.toLowerCase().includes(searchTerm)
        || item.product_name.toLowerCase().includes(searchTerm)
        || item.step_code.toLowerCase().includes(searchTerm)
        || item.step_name.toLowerCase().includes(searchTerm)
        || item.report_type.toLowerCase().includes(searchTerm),
      );
    }

    // Apply sorting
    validatedData.sort((a, b) => {
      const aValue = a[sortBy as keyof ProductionProgressReportItem];
      const bValue = b[sortBy as keyof ProductionProgressReportItem];

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
    console.error('Error fetching production progress report:', error);
    throw new Error('Failed to fetch production progress report data');
  }
}

/**
 * Calculate summary statistics from production progress data
 * @param data - Array of production progress items
 * @returns Summary statistics
 */
function calculateSummaryStatistics(
  data: ProductionProgressReportItem[],
): ProductionProgressReportSummary {
  if (data.length === 0) {
    return {
      total_records: 0,
      total_entities: 0,
      total_planned: 0,
      total_actual: 0,
      total_assigned: 0,
      total_received: 0,
      total_defect: 0,
      total_made: 0,
      average_completion_rate: 0,
      employee_count: 0,
      outsource_count: 0,
    };
  }

  const uniqueEntities = new Set(data.map(item => item.entity_id));
  const employeeRecords = data.filter(item => item.report_type === 'EMPLOYEE_SUMMARY');
  const outsourceRecords = data.filter(item => item.report_type === 'OUTSOURCE_DETAIL');
  const uniqueEmployees = new Set(employeeRecords.map(item => item.entity_id));
  const uniqueOutsources = new Set(outsourceRecords.map(item => item.entity_id));

  const totalPlanned = data.reduce((sum, item) => sum + item.total_planned, 0);
  const totalActual = data.reduce((sum, item) => sum + item.total_actual, 0);
  const totalAssigned = data.reduce((sum, item) => sum + item.total_assigned, 0);
  const totalReceived = data.reduce((sum, item) => sum + item.total_received, 0);
  const totalDefect = data.reduce((sum, item) => sum + item.total_defect, 0);
  const totalMade = data.reduce((sum, item) => sum + item.total_made, 0);
  const averageCompletionRate = data.reduce((sum, item) => sum + item.completion_rate, 0) / data.length;

  return validateProductionProgressReportSummary({
    total_records: data.length,
    total_entities: uniqueEntities.size,
    total_planned: totalPlanned,
    total_actual: totalActual,
    total_assigned: totalAssigned,
    total_received: totalReceived,
    total_defect: totalDefect,
    total_made: totalMade,
    average_completion_rate: Math.round(averageCompletionRate * 100) / 100,
    employee_count: uniqueEmployees.size,
    outsource_count: uniqueOutsources.size,
  });
}

/**
 * Get filter options for dropdowns
 * @returns Promise resolving to filter options
 */
export async function getProductionProgressReportFilterOptions(): Promise<ProductionProgressReportFilterOptions> {
  try {
    // Get all unique values from the stored procedure result
    const rawResults = await db.execute(sql`
      SELECT DISTINCT
        plan_code,
        product_code,
        product_name,
        step_code,
        step_name,
        entity_id,
        entity_name,
        report_type
      FROM sp_production_progress_report(NULL, NULL, NULL)
      ORDER BY plan_code, product_code, step_code, entity_name
    `);

    const plans = new Map<string, string>();
    const products = new Map<string, string>();
    const productionSteps = new Map<string, string>();
    const entities = new Map<string, { name: string; type: 'EMPLOYEE' | 'OUTSOURCE' }>();

    if (rawResults.rows) {
      rawResults.rows.forEach((row: any) => {
        if (row.plan_code) {
          plans.set(row.plan_code, row.plan_code);
        }
        if (row.product_code) {
          products.set(row.product_code, row.product_name || row.product_code);
        }
        if (row.step_code) {
          productionSteps.set(row.step_code, row.step_name || row.step_code);
        }
        if (row.entity_id && row.entity_name) {
          const entityType = row.report_type === 'EMPLOYEE_SUMMARY' ? 'EMPLOYEE' : 'OUTSOURCE';
          entities.set(row.entity_id, {
            name: row.entity_name,
            type: entityType,
          });
        }
      });
    }

    return {
      plans: Array.from(plans.entries()).map(([code, name]) => ({ code, name })),
      products: Array.from(products.entries()).map(([code, name]) => ({ code, name })),
      productionSteps: Array.from(productionSteps.entries()).map(([code, name]) => ({ code, name })),
      entities: Array.from(entities.entries()).map(([id, { name, type }]) => ({ id, name, type })),
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw new Error('Failed to fetch filter options');
  }
}

/**
 * Export production progress report data
 * @param params - Export parameters including filters
 * @returns Promise resolving to all filtered data for export
 */
export async function exportProductionProgressReport(
  params: ProductionProgressReportFiltersWithOwner,
): Promise<ProductionProgressReportItem[]> {
  // Get all data without pagination for export
  const result = await getProductionProgressReport({
    ...params,
    page: 1,
    limit: 10000, // Large limit to get all data
  });

  return result.data;
}

/**
 * Get production progress report statistics for dashboard
 * @param params - Filter parameters
 * @returns Promise resolving to dashboard statistics
 */
export async function getProductionProgressReportStats(
  params: ProductionProgressReportFiltersWithOwner,
): Promise<{
    totalRecords: number;
    totalEntities: number;
    totalPlanned: number;
    totalActual: number;
    totalAssigned: number;
    totalReceived: number;
    totalDefect: number;
    totalMade: number;
    averageCompletionRate: number;
    employeeCount: number;
    outsourceCount: number;
    completionRateDistribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
  }> {
  const { data } = await getProductionProgressReport({
    ...params,
    page: 1,
    limit: 10000, // Get all data for statistics
  });

  const employeeRecords = data.filter(item => item.report_type === 'EMPLOYEE_SUMMARY');
  const outsourceRecords = data.filter(item => item.report_type === 'OUTSOURCE_DETAIL');
  const uniqueEmployees = new Set(employeeRecords.map(item => item.entity_id));
  const uniqueOutsources = new Set(outsourceRecords.map(item => item.entity_id));
  const uniqueEntities = new Set(data.map(item => item.entity_id));

  // Calculate completion rate distribution
  const completionRateDistribution = data.reduce(
    (acc, item) => {
      const rate = item.completion_rate;
      if (rate >= 100) {
        acc.excellent++;
      } else if (rate >= 80) {
        acc.good++;
      } else if (rate >= 50) {
        acc.average++;
      } else {
        acc.poor++;
      }
      return acc;
    },
    { excellent: 0, good: 0, average: 0, poor: 0 },
  );

  return {
    totalRecords: data.length,
    totalEntities: uniqueEntities.size,
    totalPlanned: data.reduce((sum, item) => sum + item.total_planned, 0),
    totalActual: data.reduce((sum, item) => sum + item.total_actual, 0),
    totalAssigned: data.reduce((sum, item) => sum + item.total_assigned, 0),
    totalReceived: data.reduce((sum, item) => sum + item.total_received, 0),
    totalDefect: data.reduce((sum, item) => sum + item.total_defect, 0),
    totalMade: data.reduce((sum, item) => sum + item.total_made, 0),
    averageCompletionRate: data.length > 0
      ? Math.round((data.reduce((sum, item) => sum + item.completion_rate, 0) / data.length) * 100) / 100
      : 0,
    employeeCount: uniqueEmployees.size,
    outsourceCount: uniqueOutsources.size,
    completionRateDistribution,
  };
}
