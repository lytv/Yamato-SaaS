/**
 * Price Summary database queries
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Using stored procedure sp_product_price_pivot
 */

import { sql } from 'drizzle-orm';

import {
  validatePriceSummaryItem,
  validatePriceSummarySummary,
  validatePriceSummaryFilterOptions,
  validatePriceType,
} from '@/libs/validations/priceSummary';
import type {
  PriceSummaryFilterOptions,
  PriceSummaryFiltersWithOwner,
  PriceSummaryItem,
  PriceSummarySummary,
  PriceStepData,
  PriceType,
} from '@/types/priceSummary';
import { PRICE_TYPE_OPTIONS } from '@/types/priceSummary';

import { db } from '../DB';

/**
 * Get price summary pivot data using stored procedure
 * @param params - Query parameters including filters and pagination
 * @returns Promise resolving to price summary pivot data with pagination
 */
export async function getPriceSummary(
  params: PriceSummaryFiltersWithOwner,
): Promise<{
  data: PriceSummaryItem[];
  summary: PriceSummarySummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const {
    product_code,
    price_type = 'factory_price',
    search,
    show_only_with_pricing = false,
    page = 1,
    limit = 20,
    sortBy = 'product_code',
    sortOrder = 'asc',
  } = params;

  console.log('getPriceSummary called with params:', { show_only_with_pricing, price_type, search, product_code });

  try {
    // Validate price type
    const validPriceType = validatePriceType(price_type);

    // Call price summary stored procedure with parameters
    const rawResults = await db.execute(sql`
      SELECT * FROM sp_product_price_pivot(
        ${product_code || null},
        ${validPriceType}
      )
      ORDER BY product_code
    `);

    // Validate and transform raw results
    let validatedData: PriceSummaryItem[] = [];

    if (rawResults.rows && rawResults.rows.length > 0) {
      validatedData = rawResults.rows.map((row: any) => {
        // Convert JSONB step_data to proper format
        const stepData: Record<string, PriceStepData> = {};
        
        if (row.step_data && typeof row.step_data === 'object') {
          Object.entries(row.step_data).forEach(([stepCode, stepInfo]: [string, any]) => {
            if (stepInfo && typeof stepInfo === 'object') {
              stepData[stepCode] = {
                step_code: stepInfo.step_code || stepCode,
                step_name: stepInfo.step_name || stepCode,
                sequence_number: Number(stepInfo.sequence_number) || 0,
                price: Number(stepInfo.price) || 0,
              };
            }
          });
        }

        // Calculate has_pricing based on actual price values
        const hasActualPricing = Object.values(stepData).some(step => step.price > 0) || Number(row.total_price) > 0;

        // Create the item with proper types
        const item: PriceSummaryItem = {
          product_code: row.product_code || '',
          product_name: row.product_name || '',
          step_data: stepData,
          total_steps: Number(row.total_steps) || 0,
          total_price: Number(row.total_price) || 0,
          has_pricing: hasActualPricing,
        };

        return validatePriceSummaryItem(item);
      });
    }

    // Apply search filter if provided
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase().trim();
      validatedData = validatedData.filter(item => {
        // Search in basic fields
        if (
          item.product_code.toLowerCase().includes(searchTerm) ||
          item.product_name.toLowerCase().includes(searchTerm)
        ) {
          return true;
        }

        // Search in step data
        return Object.values(item.step_data).some(step => 
          step.step_code.toLowerCase().includes(searchTerm) ||
          step.step_name.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Apply pricing filter if requested
    if (show_only_with_pricing) {
      const beforeCount = validatedData.length;
      validatedData = validatedData.filter(item => item.has_pricing);
      const afterCount = validatedData.length;
      console.log(`Pricing filter applied: ${beforeCount} -> ${afterCount} items (removed ${beforeCount - afterCount} items without pricing)`);
    }

    // Apply sorting
    validatedData.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'product_code':
          aValue = a.product_code;
          bValue = b.product_code;
          break;
        case 'product_name':
          aValue = a.product_name;
          bValue = b.product_name;
          break;
        case 'total_steps':
          aValue = a.total_steps;
          bValue = b.total_steps;
          break;
        case 'total_price':
          aValue = a.total_price;
          bValue = b.total_price;
          break;
        default:
          aValue = a.product_code;
          bValue = b.product_code;
      }

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Calculate summary statistics
    const summary = calculateSummaryStatistics(validatedData, validPriceType);

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
    console.error('Error fetching price summary:', error);
    throw new Error('Failed to fetch price summary data');
  }
}

/**
 * Calculate summary statistics from price summary data
 * @param data - Array of price summary items
 * @param priceType - Type of price being analyzed
 * @returns Summary statistics
 */
function calculateSummaryStatistics(
  data: PriceSummaryItem[],
  _priceType: PriceType,
): PriceSummarySummary {
  if (data.length === 0) {
    return {
      total_records: 0,
      total_products: 0,
      total_steps_with_pricing: 0,
      average_price_per_product: 0,
      highest_priced_product: '',
      lowest_priced_product: '',
    };
  }

  const productsWithPricing = data.filter(item => item.has_pricing);
  const totalPrices = productsWithPricing.map(item => item.total_price);
  const totalStepsWithPricing = data.reduce((sum, item) => sum + item.total_steps, 0);

  let highestPricedProduct = '';
  let lowestPricedProduct = '';
  let maxPrice = 0;
  let minPrice = Infinity;

  productsWithPricing.forEach(item => {
    if (item.total_price > maxPrice) {
      maxPrice = item.total_price;
      highestPricedProduct = item.product_name;
    }
    if (item.total_price < minPrice) {
      minPrice = item.total_price;
      lowestPricedProduct = item.product_name;
    }
  });

  const averagePrice = totalPrices.length > 0 
    ? totalPrices.reduce((sum, price) => sum + price, 0) / totalPrices.length 
    : 0;

  return validatePriceSummarySummary({
    total_records: data.length,
    total_products: productsWithPricing.length,
    total_steps_with_pricing: totalStepsWithPricing,
    average_price_per_product: Math.round(averagePrice * 100) / 100,
    highest_priced_product: highestPricedProduct,
    lowest_priced_product: lowestPricedProduct,
  });
}

/**
 * Get filter options for dropdowns
 * @returns Promise resolving to filter options
 */
export async function getPriceSummaryFilterOptions(_ownerId?: string): Promise<PriceSummaryFilterOptions> {
  try {
    // Get products with pricing data from stored procedure
    const rawResults = await db.execute(sql`
      SELECT * FROM sp_product_price_pivot_filter_products()
      LIMIT 200
    `);

    const products = new Map<string, string>();
    const steps = new Map<string, string>();

    // Extract unique values from stored procedure results
    if (rawResults.rows && rawResults.rows.length > 0) {
      rawResults.rows.forEach((row: any) => {
        if (row.product_code && row.product_name) {
          products.set(row.product_code, row.product_name);
        }
      });
    }

    // Get available steps from production_step table
    try {
      const stepsResult = await db.execute(sql`
        SELECT DISTINCT step_code, step_name 
        FROM production_step 
        WHERE step_code IS NOT NULL 
          AND step_name IS NOT NULL
        ORDER BY step_code
        LIMIT 200
      `);
      
      if (stepsResult.rows) {
        stepsResult.rows.forEach((row: any) => {
          if (row.step_code && row.step_name) {
            steps.set(row.step_code, row.step_name);
          }
        });
      }
    } catch (stepsError) {
      console.warn('Failed to fetch steps:', stepsError);
    }

    return validatePriceSummaryFilterOptions({
      products: Array.from(products.entries()).map(([code, name]) => ({ code, name })),
      price_types: [...PRICE_TYPE_OPTIONS],
      steps: Array.from(steps.entries()).map(([code, name]) => ({ code, name })),
    });
  } catch (error) {
    console.error('Error fetching price summary filter options:', error);
    
    // Return safe default structure
    return validatePriceSummaryFilterOptions({
      products: [],
      price_types: [...PRICE_TYPE_OPTIONS],
      steps: [],
    });
  }
}

/**
 * Export price summary data
 * @param params - Export parameters including filters
 * @returns Promise resolving to all filtered data for export
 */
export async function exportPriceSummary(
  params: PriceSummaryFiltersWithOwner,
): Promise<PriceSummaryItem[]> {
  // Get all data without pagination for export
  const result = await getPriceSummary({
    ...params,
    page: 1,
    limit: 10000, // Large limit to get all data
  });

  return result.data;
}

/**
 * Get available price types from stored procedure
 * @returns Promise resolving to price type options
 */
export async function getPriceTypes(): Promise<Array<{
  price_type: string;
  price_label: string;
  description: string;
}>> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM sp_product_price_pivot_price_types()
    `);

    if (result.rows && result.rows.length > 0) {
      return result.rows.map((row: any) => ({
        price_type: row.price_type || '',
        price_label: row.price_label || '',
        description: row.description || '',
      }));
    }

    // Fallback to constants
    return PRICE_TYPE_OPTIONS.map(option => ({
      price_type: option.value,
      price_label: option.label,
      description: option.description,
    }));
  } catch (error) {
    console.error('Error fetching price types:', error);
    
    // Fallback to constants
    return PRICE_TYPE_OPTIONS.map(option => ({
      price_type: option.value,
      price_label: option.label,
      description: option.description,
    }));
  }
}