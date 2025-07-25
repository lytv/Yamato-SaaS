/**
 * Satellite Progress database queries
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Using stored procedure sp_satellite_progress_pivot
 */

import { sql } from 'drizzle-orm';

import {
  validateSatelliteProgressItem,
  validateSatelliteProgressSummary,
  validateSatelliteProgressFilterOptions,
} from '@/libs/validations/satelliteProgress';
import type {
  SatelliteProgressFilterOptions,
  SatelliteProgressFiltersWithOwner,
  SatelliteProgressItem,
  SatelliteProgressSummary,
} from '@/types/satelliteProgress';

import { db } from '../DB';


/**
 * Get satellite progress pivot data using stored procedure
 * @param params - Query parameters including filters and pagination
 * @returns Promise resolving to satellite progress pivot data with pagination
 */
export async function getSatelliteProgress(
  params: SatelliteProgressFiltersWithOwner,
): Promise<{
  data: SatelliteProgressItem[];
  summary: SatelliteProgressSummary;
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
    assigned_user_id,
    search,
    page = 1,
    limit = 20,
    sortBy = 'product_code',
    sortOrder = 'asc',
  } = params;

  try {
    // Call satellite progress stored procedure with parameters
    const rawResults = await db.execute(sql`
      SELECT * FROM sp_satellite_progress_pivot(
        ${product_code || null},
        ${plan_code || null},
        ${assigned_user_id || null}
      )
      LIMIT ${Math.min(limit || 20, 100)}
    `);

    // Validate and transform raw results
    let validatedData: SatelliteProgressItem[] = [];

    if (rawResults.rows && rawResults.rows.length > 0) {
      validatedData = rawResults.rows.map((row: any) => {
        // Parse JSON step data and convert to fixed format for backward compatibility
        const stepData = row.step_data || {};
        
        // Sort step codes by numeric value after 'cd' prefix for proper ordering (cd01, cd02, cd10, cd20)
        const stepKeys = Object.keys(stepData).sort((a, b) => {
          // Extract numeric part from step codes like 'cd01', 'cd02', etc.
          const getNumericPart = (code: string) => {
            const match = code.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
          };
          return getNumericPart(a) - getNumericPart(b);
        });
        
        // Create the item with base data
        const item: any = {
          product_code: row.product_code,
          product_name: row.product_name,
          plan_code: row.plan_code,
          plan_name: row.plan_name,
          assigned_user_name: row.assigned_user_name,
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

        return validateSatelliteProgressItem(item);
      });
    }

    // Apply search filter if provided
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase().trim();
      validatedData = validatedData.filter(item => {
        // Search in basic fields
        if (item.product_code.toLowerCase().includes(searchTerm) ||
            item.product_name.toLowerCase().includes(searchTerm) ||
            item.plan_code.toLowerCase().includes(searchTerm) ||
            item.plan_name.toLowerCase().includes(searchTerm) ||
            item.assigned_user_name.toLowerCase().includes(searchTerm)) {
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
      const aValue = a[sortBy as keyof SatelliteProgressItem];
      const bValue = b[sortBy as keyof SatelliteProgressItem];

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
    console.error('Error fetching satellite progress:', error);
    throw new Error('Failed to fetch satellite progress data');
  }
}

/**
 * Calculate summary statistics from satellite progress data
 * @param data - Array of satellite progress items
 * @returns Summary statistics
 */
function calculateSummaryStatistics(
  data: SatelliteProgressItem[],
): SatelliteProgressSummary {
  if (data.length === 0) {
    return {
      total_records: 0,
      total_planned: 0,
      total_completed: 0,
      average_completion_rate: 0,
      users_count: 0,
      plans_count: 0,
    };
  }

  const uniqueUsers = new Set(data.map(item => item.assigned_user_name));
  const uniquePlans = new Set(data.map(item => item.plan_code));

  const totalPlanned = data.reduce((sum, item) => sum + item.planned_quantity, 0);
  const totalCompleted = data.reduce((sum, item) => sum + item.total_completed, 0);
  const averageCompletionRate = data.reduce((sum, item) => sum + item.completion_rate, 0) / data.length;

  return validateSatelliteProgressSummary({
    total_records: data.length,
    total_planned: totalPlanned,
    total_completed: totalCompleted,
    average_completion_rate: Math.round(averageCompletionRate * 100) / 100,
    users_count: uniqueUsers.size,
    plans_count: uniquePlans.size,
  });
}

/**
 * Get filter options for dropdowns
 * @returns Promise resolving to filter options
 */
export async function getSatelliteProgressFilterOptions(_ownerId?: string): Promise<SatelliteProgressFilterOptions> {
  try {
    // Get data from the same source as the main data - the stored procedure
    // This ensures consistency between filter options and actual data
    const rawResults = await db.execute(sql`
      SELECT * FROM sp_satellite_progress_pivot(
        ${null}, -- No product filter
        ${null}, -- No plan filter  
        ${null}  -- No user filter
      )
      LIMIT 500
    `);

    const plans = new Map<string, string>();
    const products = new Map<string, string>();
    const users = new Map<string, string>();

    // Extract unique values from stored procedure results
    if (rawResults.rows && rawResults.rows.length > 0) {
      rawResults.rows.forEach((row: any) => {
        // Extract products
        if (row.product_code && row.product_name) {
          products.set(row.product_code, row.product_name);
        }
        
        // Extract plans
        if (row.plan_code && row.plan_name) {
          plans.set(row.plan_code, row.plan_name);
        }
        
        // Extract users - we'll need to get user_id from a lookup
        if (row.assigned_user_name) {
          users.set(row.assigned_user_name, row.assigned_user_name);
        }
      });
    }

    // Always get users from user_sync table for proper user_id mapping
    try {
      const usersResult = await db.execute(sql`
        SELECT DISTINCT user_id, user_name 
        FROM user_sync 
        WHERE user_name IS NOT NULL 
        ORDER BY user_name
        LIMIT 100
      `);
      
      if (usersResult.rows) {
        users.clear(); // Clear the users from stored procedure
        usersResult.rows.forEach((row: any) => {
          if (row.user_id && row.user_name) {
            users.set(row.user_id, row.user_name);
          }
        });
      }
    } catch (userError) {
      console.warn('Failed to fetch users:', userError);
    }

    // If no data from stored procedure, fallback to direct queries
    if (products.size === 0 || plans.size === 0) {
      try {
        // Simple direct queries as fallback
        const [productsResult, plansResult] = await Promise.all([
          db.execute(sql`SELECT DISTINCT product_code, product_name FROM product WHERE product_code IS NOT NULL LIMIT 100`),
          db.execute(sql`SELECT DISTINCT plan_code, plan_name FROM plan WHERE plan_code IS NOT NULL LIMIT 100`)
        ]);

        // Process fallback results
        if (productsResult.rows) {
          productsResult.rows.forEach((row: any) => {
            if (row.product_code) {
              products.set(row.product_code, row.product_name || row.product_code);
            }
          });
        }

        if (plansResult.rows) {
          plansResult.rows.forEach((row: any) => {
            if (row.plan_code) {
              plans.set(row.plan_code, row.plan_name || row.plan_code);
            }
          });
        }

      } catch (fallbackError) {
        console.warn('Fallback queries also failed:', fallbackError);
      }
    }

    return validateSatelliteProgressFilterOptions({
      plans: Array.from(plans.entries()).map(([code, name]) => ({ code, name })),
      products: Array.from(products.entries()).map(([code, name]) => ({ code, name })),
      users: Array.from(users.entries()).map(([user_id, user_name]) => ({ user_id, user_name })),
      steps: [], // Will be populated from step_data if needed
    });
  } catch (error) {
    console.error('Error fetching satellite progress filter options:', error);
    
    // Last resort: return empty structure to prevent UI crash
    return validateSatelliteProgressFilterOptions({
      plans: [],
      products: [],
      users: [],
      steps: [],
    });
  }
}

/**
 * Export satellite progress data
 * @param params - Export parameters including filters
 * @returns Promise resolving to all filtered data for export
 */
export async function exportSatelliteProgress(
  params: SatelliteProgressFiltersWithOwner,
): Promise<SatelliteProgressItem[]> {
  // Get all data without pagination for export
  const result = await getSatelliteProgress({
    ...params,
    page: 1,
    limit: 10000, // Large limit to get all data
  });

  return result.data;
}