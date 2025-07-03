/**
 * Plans Export API Route - GET
 * Following TDD Workflow Standards and established API patterns
 * Exports plans to Excel format respecting search/filter/sort context
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { getPaginatedPlans } from '@/libs/queries/plan';
import { validatePlanExportParams } from '@/libs/validations/plan';
import type { PlanListParamsWithOwner } from '@/types/plan';
import { generateExcelFilename, generatePlansExcel, validatePlansExportData } from '@/utils/excelHelpers';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // ✅ CRITICAL: Same auth pattern as main plans API
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    // Handle both NextRequest (runtime) and Request (testing)
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // ✅ CRITICAL: Convert null to undefined (following 400 fix pattern)
    const queryParams = {
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    // ✅ Validation with proper error handling
    const validatedParams = validatePlanExportParams(queryParams);

    // Add ownerId to the validated params for multi-tenancy
    const paramsWithOwner: PlanListParamsWithOwner = {
      // No pagination for export - get all records up to limit
      page: 1,
      limit: 5000, // Maximum export limit
      search: validatedParams.search,
      sortBy: validatedParams.sortBy as PlanListParamsWithOwner['sortBy'],
      sortOrder: validatedParams.sortOrder as PlanListParamsWithOwner['sortOrder'],
      ownerId: orgId || userId,
    };

    // Fetch plans without pagination limits (up to 5000)
    const result = await getPaginatedPlans(paramsWithOwner);

    // Validate export data
    const validation = validatePlansExportData(result.plans);
    if (!validation.isValid) {
      return Response.json(
        { success: false, error: validation.error, code: 'EXPORT_VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    // Generate Excel file
    const excelBuffer = generatePlansExcel(result.plans);
    const filename = generateExcelFilename('plans-export');

    // Return file response with proper headers
    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error exporting plans:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { success: false, error: 'Invalid parameters', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 },
      );
    }

    // Handle Excel generation errors
    if (error instanceof Error && error.message.includes('Excel')) {
      return Response.json(
        { success: false, error: 'Failed to generate Excel file', code: 'EXCEL_GENERATION_ERROR' },
        { status: 500 },
      );
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
