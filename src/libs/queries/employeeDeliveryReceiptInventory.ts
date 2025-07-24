/**
 * Employee Delivery Receipt Inventory database queries
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Using stored procedure sp_employee_delivery_receipt_inventory
 */

import { sql } from 'drizzle-orm';

import {
  validateEmployeeDeliveryReceiptInventoryItem,
  validateEmployeeDeliveryReceiptInventorySummary,
} from '@/libs/validations/employeeDeliveryReceiptInventory';
import type {
  EmployeeDeliveryReceiptInventoryFilterOptions,
  EmployeeDeliveryReceiptInventoryFiltersWithOwner,
  EmployeeDeliveryReceiptInventoryItem,
  EmployeeDeliveryReceiptInventorySummary,
} from '@/types/employeeDeliveryReceiptInventory';

import { db } from '../DB';

/**
 * Get employee delivery receipt inventory data using stored procedure
 * @param params - Query parameters including filters and pagination
 * @returns Promise resolving to inventory data with pagination
 */
export async function getEmployeeDeliveryReceiptInventory(
  params: EmployeeDeliveryReceiptInventoryFiltersWithOwner,
): Promise<{
    data: EmployeeDeliveryReceiptInventoryItem[];
    summary: EmployeeDeliveryReceiptInventorySummary;
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
    employee_id,
    search,
    page = 1,
    limit = 20,
    sortBy = 'employee_name',
    sortOrder = 'asc',
  } = params;

  try {
    // Call stored procedure with parameters
    const rawResults = await db.execute(sql`
      SELECT * FROM sp_employee_delivery_receipt_inventory(
        ${plan_code || null},
        ${product_code || null},
        ${production_step_code || null},
        ${employee_id || null}
      )
    `);

    // Validate and transform raw results
    let validatedData: EmployeeDeliveryReceiptInventoryItem[] = [];

    if (rawResults.rows && rawResults.rows.length > 0) {
      validatedData = rawResults.rows.map((row: any) => {
        return validateEmployeeDeliveryReceiptInventoryItem({
          employee_id: row.employee_id,
          employee_name: row.employee_name,
          plan_code: row.plan_code,
          product_code: row.product_code,
          product_name: row.product_name,
          step_code: row.step_code,
          step_name: row.step_name,
          total_assigned: Number(row.total_assigned) || 0,
          total_received: Number(row.total_received) || 0,
          total_defect: Number(row.total_defect) || 0,
          total_rework: Number(row.total_rework) || 0,
          current_inventory: Number(row.current_inventory) || 0,
          completion_rate: Number(row.completion_rate) || 0,
        });
      });
    }

    // Apply search filter if provided
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase().trim();
      validatedData = validatedData.filter(item =>
        item.employee_name.toLowerCase().includes(searchTerm)
        || item.plan_code.toLowerCase().includes(searchTerm)
        || item.product_code.toLowerCase().includes(searchTerm)
        || item.product_name.toLowerCase().includes(searchTerm)
        || item.step_code.toLowerCase().includes(searchTerm)
        || item.step_name.toLowerCase().includes(searchTerm),
      );
    }

    // Apply sorting
    validatedData.sort((a, b) => {
      const aValue = a[sortBy as keyof EmployeeDeliveryReceiptInventoryItem];
      const bValue = b[sortBy as keyof EmployeeDeliveryReceiptInventoryItem];

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
    console.error('Error fetching employee delivery receipt inventory:', error);
    throw new Error('Failed to fetch employee delivery receipt inventory data');
  }
}

/**
 * Calculate summary statistics from inventory data
 * @param data - Array of inventory items
 * @returns Summary statistics
 */
function calculateSummaryStatistics(
  data: EmployeeDeliveryReceiptInventoryItem[],
): EmployeeDeliveryReceiptInventorySummary {
  if (data.length === 0) {
    return {
      total_records: 0,
      total_employees: 0,
      total_assigned: 0,
      total_received: 0,
      total_defect: 0,
      total_rework: 0,
      total_inventory: 0,
      average_completion_rate: 0,
    };
  }

  const uniqueEmployees = new Set(data.map(item => item.employee_id));
  const totalAssigned = data.reduce((sum, item) => sum + item.total_assigned, 0);
  const totalReceived = data.reduce((sum, item) => sum + item.total_received, 0);
  const totalDefect = data.reduce((sum, item) => sum + item.total_defect, 0);
  const totalRework = data.reduce((sum, item) => sum + item.total_rework, 0);
  const totalInventory = data.reduce((sum, item) => sum + item.current_inventory, 0);
  const averageCompletionRate = data.reduce((sum, item) => sum + item.completion_rate, 0) / data.length;

  return validateEmployeeDeliveryReceiptInventorySummary({
    total_records: data.length,
    total_employees: uniqueEmployees.size,
    total_assigned: totalAssigned,
    total_received: totalReceived,
    total_defect: totalDefect,
    total_rework: totalRework,
    total_inventory: totalInventory,
    average_completion_rate: Math.round(averageCompletionRate * 100) / 100,
  });
}

/**
 * Get filter options for dropdowns
 * @param ownerId - Owner ID for multi-tenancy
 * @returns Promise resolving to filter options
 */
export async function getEmployeeDeliveryReceiptInventoryFilterOptions(): Promise<EmployeeDeliveryReceiptInventoryFilterOptions> {
  try {
    // Get all unique values from the stored procedure result
    const rawResults = await db.execute(sql`
      SELECT DISTINCT
        plan_code,
        plan_code as plan_name,
        product_code,
        product_name,
        step_code,
        step_name,
        employee_id,
        employee_name
      FROM sp_employee_delivery_receipt_inventory(NULL, NULL, NULL, NULL)
      ORDER BY plan_code, product_code, step_code, employee_name
    `);

    const plans = new Map<string, string>();
    const products = new Map<string, string>();
    const productionSteps = new Map<string, string>();
    const employees = new Map<string, string>();

    if (rawResults.rows) {
      rawResults.rows.forEach((row: any) => {
        if (row.plan_code) {
          plans.set(row.plan_code, row.plan_name || row.plan_code);
        }
        if (row.product_code) {
          products.set(row.product_code, row.product_name || row.product_code);
        }
        if (row.step_code) {
          productionSteps.set(row.step_code, row.step_name || row.step_code);
        }
        if (row.employee_id) {
          employees.set(row.employee_id, row.employee_name || row.employee_id);
        }
      });
    }

    return {
      plans: Array.from(plans.entries()).map(([code, name]) => ({ code, name })),
      products: Array.from(products.entries()).map(([code, name]) => ({ code, name })),
      productionSteps: Array.from(productionSteps.entries()).map(([code, name]) => ({ code, name })),
      employees: Array.from(employees.entries()).map(([id, name]) => ({ id, name })),
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    throw new Error('Failed to fetch filter options');
  }
}

/**
 * Export employee delivery receipt inventory data
 * @param params - Export parameters including filters
 * @returns Promise resolving to all filtered data for export
 */
export async function exportEmployeeDeliveryReceiptInventory(
  params: EmployeeDeliveryReceiptInventoryFiltersWithOwner,
): Promise<EmployeeDeliveryReceiptInventoryItem[]> {
  // Get all data without pagination for export
  const result = await getEmployeeDeliveryReceiptInventory({
    ...params,
    page: 1,
    limit: 10000, // Large limit to get all data
  });

  return result.data;
}
