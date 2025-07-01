/**
 * ProductSubs Export API Route - GET
 * Following TDD Workflow Standards and established API patterns
 * Exports productsubsubs to Excel format respecting search/filter/sort context
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { getPaginatedProductSubs } from '@/libs/queries/productsub';
import { validateProductSubExportParams } from '@/libs/validations/productsub';
import type { ProductSubListParamsWithOwner } from '@/types/productsub';
import { generateExcelFilename, generateProductsExcel, validateExcelExportData } from '@/utils/excelHelpers';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // ✅ CRITICAL: Same auth pattern as main productsubsubs API
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
    const validatedParams = validateProductSubExportParams(queryParams);

    // Add ownerId to the validated params for multi-tenancy
    const paramsWithOwner: ProductSubListParamsWithOwner = {
      // No pagination for export - get all records up to limit
      page: 1,
      limit: 5000, // Maximum export limit
      search: validatedParams.search,
      sortBy: validatedParams.sortBy as ProductSubListParamsWithOwner['sortBy'],
      sortOrder: validatedParams.sortOrder as ProductSubListParamsWithOwner['sortOrder'],
      ownerId: orgId || userId,
    };

    // Fetch productsubsubs without pagination limits (up to 5000)
    const result = await getPaginatedProductSubs(paramsWithOwner);

    // Mapping productsubsubs sang ProductSub export format
    const productSubsExport = result.productsubsubs.map(item => ({
      id: item.id,
      ownerId: item.ownerId,
      productCode: item.productSubCode,
      productName: item.productSubDetail,
      category: item.subCategory,
      notes: item.note,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    // Validate export data
    const validation = validateExcelExportData(productSubsExport);
    if (!validation.isValid) {
      return Response.json(
        { success: false, error: validation.error, code: 'EXPORT_VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const excelBuffer = generateProductsExcel(productSubsExport);
    const filename = generateExcelFilename('productsubsubs-export');

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
    console.error('Error exporting productsubs:', error);

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
