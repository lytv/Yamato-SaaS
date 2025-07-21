/**
 * Employee Delivery Receipt Inventory Filter Options API Routes - GET
 * Following TDD Workflow Standards and Yamato-SaaS patterns
 * Provides filter options for dropdown components
 */

import { auth } from '@clerk/nextjs/server';

import { getEmployeeDeliveryReceiptInventoryFilterOptions } from '@/libs/queries/employeeDeliveryReceiptInventory';

export async function GET(): Promise<Response> {
  try {
    // ✅ CRITICAL: Handle both sync/async auth (from debug guide)
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const filterOptions = await getEmployeeDeliveryReceiptInventoryFilterOptions();

    return Response.json({
      success: true,
      data: filterOptions,
      message: 'Filter options retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);

    if (error instanceof Error) {
      // Handle specific database or business logic errors
      if (error.message.includes('Failed to fetch')) {
        return Response.json(
          { success: false, error: 'Unable to retrieve filter options', code: 'FETCH_ERROR' },
          { status: 500 },
        );
      }
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

// ✅ Add caching headers for filter options since they don't change frequently
export const revalidate = 300; // Cache for 5 minutes
