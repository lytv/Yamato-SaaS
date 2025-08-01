/**
 * Plan Import API Route
 * POST /api/plans/import - Import plans from Excel file
 * Following existing plan API patterns and auth
 */

import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { createPlan as createPlanDb, getPlanByCode } from '@/libs/queries/plan';
import type { ImportError } from '@/types/import';
import type { Plan } from '@/types/plan';
import { parseYmtPlanForPlan, validatePlanImportData } from '@/utils/excelImportHelpers';

// Force dynamic rendering due to auth() usage and file upload
export const dynamic = 'force-dynamic';

/**
 * POST /api/plans/import - Import plans from Excel file
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

    // Native Next.js FormData handling (no multer needed)
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

    // Parse Excel using YMT Plan format for plan
    const buffer = Buffer.from(await file.arrayBuffer());
    const importData = await parseYmtPlanForPlan(buffer);

    // Validate data
    const validation = validatePlanImportData(importData);

    // Create plan
    const ownerId = orgId || userId;
    const results = await processImportData(validation.validPlans, ownerId);

    return Response.json({
      success: true,
      data: {
        totalRows: importData.length,
        successCount: results.successful.length,
        errorCount: results.failed.length,
        skippedCount: results.skipped,
        createdPlans: results.successful,
        errors: [...validation.errors, ...results.failed],
      },
    });
  } catch (error) {
    console.error('Error importing plans:', error);

    if (error instanceof ZodError) {
      return Response.json(
        { success: false, error: 'Invalid request data', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Failed to parse Excel file')) {
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

// Helper function using existing createPlan in loop
async function processImportData(plans: Array<{ planCode: string; planName: string; planYear: number; planMonth: number; rowNumber: number }>, ownerId: string): Promise<{
  successful: Plan[];
  failed: ImportError[];
  skipped: number;
}> {
  const successful: Plan[] = [];
  const failed: ImportError[] = [];
  let skipped = 0;

  for (const planData of plans) {
    try {
      // Check for existing plan code
      const existing = await getPlanByCode(planData.planCode, ownerId);
      if (existing) {
        // Skip if already exists
        skipped++;
        continue;
      }

      // Create plan using existing database function
      const dbPlan = await createPlanDb({
        ownerId,
        planCode: planData.planCode,
        planName: planData.planName,
        planYear: planData.planYear,
        planMonth: planData.planMonth,
        status: 'draft',
      });

      // Transform database plan to API plan type
      const plan: Plan = {
        id: dbPlan.id,
        ownerId: dbPlan.ownerId,
        planCode: dbPlan.planCode,
        planName: dbPlan.planName,
        planYear: dbPlan.planYear,
        planMonth: dbPlan.planMonth,
        totalTargetQuantity: dbPlan.totalTargetQuantity,
        totalActualQuantity: dbPlan.totalActualQuantity,
        status: dbPlan.status,
        planStartDate: dbPlan.planStartDate,
        planEndDate: dbPlan.planEndDate,
        approvedBy: dbPlan.approvedBy,
        approvedAt: dbPlan.approvedAt,
        note: dbPlan.note,
        createdAt: dbPlan.createdAt.toISOString(),
        updatedAt: dbPlan.updatedAt.toISOString(),
      };

      successful.push(plan);
    } catch (error) {
      failed.push({
        rowNumber: planData.rowNumber,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to create plan',
        value: planData.planCode,
      });
    }
  }

  return { successful, failed, skipped };
}
