/**
 * PlanDetail Import API Route
 * POST /api/plandetails/import - Import plan_details from YMT Plan Excel file
 */

import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { createPlanDetail } from '@/libs/queries/plandetail';
import { getPlanByCode } from '@/libs/queries/plan';
import { getProductByName } from '@/libs/queries/product';
import { getProductSubByDetail } from '@/libs/queries/productsub';
import type { ImportError } from '@/types/import';
import type { PlanDetail } from '@/types/plandetail';
import { parseYmtPlanForPlanDetail, validatePlanDetailImportData, type ImportPlanDetailData } from '@/utils/excelImportHelpers';

// Force dynamic rendering due to auth() usage and file upload
export const dynamic = 'force-dynamic';

/**
 * POST /api/plandetails/import - Import plan_details from Excel file
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Same auth pattern as existing APIs
    const { userId, orgId } = await auth();
    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    // Native Next.js FormData handling
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // File validation
    if (!file || file.size === 0) {
      return Response.json(
        { success: false, error: 'No file provided', code: 'NO_FILE' },
        { status: 400 },
      );
    }

    // Size and type validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return Response.json(
        { success: false, error: 'File too large (max 10MB)', code: 'FILE_TOO_LARGE' },
        { status: 400 },
      );
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { success: false, error: 'Invalid file type. Only .xlsx and .xls files are allowed', code: 'INVALID_FILE_TYPE' },
        { status: 400 },
      );
    }

    // Parse Excel using YMT Plan format
    const buffer = Buffer.from(await file.arrayBuffer());
    const importData = await parseYmtPlanForPlanDetail(buffer);

    // Validate data
    const validation = validatePlanDetailImportData(importData);

    // Create plan_details
    const ownerId = orgId || userId;
    const results = await processImportData(validation.validPlanDetails, ownerId);

    return Response.json({
      success: true,
      imported: results.successful.length,
      failed: results.failed.length,
      errors: [...validation.errors, ...results.failed].map(err => 
        typeof err === 'string' ? err : `Row ${err.rowNumber}: ${err.message}`
      ),
      plandetails: results.successful,
    });
  } catch (error) {
    console.error('Error importing plan_details:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { success: false, error: 'Invalid request data', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Failed to parse YMT Plan Excel file')) {
        return Response.json(
          { success: false, error: error.message, code: 'EXCEL_PARSE_ERROR' },
          { status: 400 },
        );
      }

      return Response.json(
        { success: false, error: error.message, code: 'IMPORT_ERROR' },
        { status: 400 },
      );
    }

    return Response.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

// Helper function to process import data
async function processImportData(planDetails: ImportPlanDetailData[], ownerId: string): Promise<{
  successful: PlanDetail[];
  failed: ImportError[];
  skipped: number;
}> {
  const successful: PlanDetail[] = [];
  const failed: ImportError[] = [];
  let skipped = 0;

  for (const planDetailData of planDetails) {
    try {
      // Get plan by planCode
      const plan = await getPlanByCode(planDetailData.planCode, ownerId);
      if (!plan) {
        failed.push({
          rowNumber: planDetailData.rowNumber,
          field: 'planCode',
          message: `Plan not found: ${planDetailData.planCode}`,
          value: planDetailData.planCode,
        });
        continue;
      }

      // Get product by name
      const product = await getProductByName(planDetailData.productName, ownerId);
      if (!product) {
        failed.push({
          rowNumber: planDetailData.rowNumber,
          field: 'productName',
          message: `Product not found: ${planDetailData.productName}`,
          value: planDetailData.productName,
        });
        continue;
      }

      // Get product_sub by detail
      const productSub = await getProductSubByDetail(planDetailData.productSubDetail, ownerId);
      if (!productSub) {
        failed.push({
          rowNumber: planDetailData.rowNumber,
          field: 'productSubDetail',
          message: `Product sub not found: ${planDetailData.productSubDetail}`,
          value: planDetailData.productSubDetail,
        });
        continue;
      }

      // Create plan_detail using existing database function
      const createData = {
        ownerId,
        planId: plan.id,
        locationCode: planDetailData.locationCode,
        locationType: 'production', // Default location type for production plans
        productCode: product.productCode,
        productSubCode: productSub.productSubCode,
        plannedQuantity: planDetailData.plannedQuantity,
        actualQuantity: 0, // Default to 0
        status: 'planned', // Default status
        priority: 5, // Default priority
        note: `Imported from YMT Plan ${planDetailData.planCode}`,
      };
      
      
      const dbPlanDetail = await createPlanDetail(createData);

      // Transform database plan_detail to API plan_detail type
      const planDetail: PlanDetail = {
        id: dbPlanDetail.id,
        ownerId: dbPlanDetail.ownerId,
        planId: dbPlanDetail.planId,
        locationCode: dbPlanDetail.locationCode,
        locationType: dbPlanDetail.locationType,
        productCode: dbPlanDetail.productCode,
        productSubCode: dbPlanDetail.productSubCode,
        plannedQuantity: dbPlanDetail.plannedQuantity,
        actualQuantity: dbPlanDetail.actualQuantity,
        plannedStartDate: dbPlanDetail.plannedStartDate ? new Date(dbPlanDetail.plannedStartDate).toISOString() : null,
        plannedEndDate: dbPlanDetail.plannedEndDate ? new Date(dbPlanDetail.plannedEndDate).toISOString() : null,
        actualStartDate: dbPlanDetail.actualStartDate ? new Date(dbPlanDetail.actualStartDate).toISOString() : null,
        actualEndDate: dbPlanDetail.actualEndDate ? new Date(dbPlanDetail.actualEndDate).toISOString() : null,
        status: dbPlanDetail.status,
        priority: dbPlanDetail.priority,
        note: dbPlanDetail.note,
        createdAt: dbPlanDetail.createdAt.toISOString(),
        updatedAt: dbPlanDetail.updatedAt.toISOString(),
      };

      successful.push(planDetail);
    } catch (error) {
      failed.push({
        rowNumber: planDetailData.rowNumber,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to create plan_detail',
        value: `${planDetailData.productName} - ${planDetailData.productSubDetail}`,
      });
    }
  }


  return { successful, failed, skipped };
}