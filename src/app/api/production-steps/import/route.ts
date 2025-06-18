import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { createProductionStep as createProductionStepDb, getProductionStepByCode } from '@/libs/queries/productionStep';
import type { ImportError, ImportProductionStepData } from '@/types/import';
import type { ProductionStep } from '@/types/productionStep';
import { parseProductionStepExcelFile, validateProductionStepImportData } from '@/utils/excelImportHelpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      return Response.json(
        { success: false, error: 'No file provided', code: 'NO_FILE' },
        { status: 400 },
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return Response.json(
        { success: false, error: 'File too large (max 10MB)', code: 'FILE_TOO_LARGE' },
        { status: 400 },
      );
    }

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { success: false, error: 'Invalid file type. Only .xlsx and .xls files are allowed', code: 'INVALID_FILE_TYPE' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const importData = await parseProductionStepExcelFile(buffer);
    const validation = validateProductionStepImportData(importData);

    const ownerId = orgId || userId;
    const results = await processImportData(validation.validProducts as unknown as ImportProductionStepData[], ownerId);

    return Response.json({
      success: true,
      data: {
        totalRows: importData.length,
        successCount: results.successful.length,
        errorCount: results.failed.length,
        createdProductionSteps: results.successful,
        errors: [...validation.errors, ...results.failed],
      },
    });
  } catch (error) {
    console.error('Error importing production steps:', error);

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

async function processImportData(
  productionSteps: ImportProductionStepData[],
  ownerId: string,
): Promise<{
    successful: ProductionStep[];
    failed: ImportError[];
  }> {
  const successful: ProductionStep[] = [];
  const failed: ImportError[] = [];

  for (const stepData of productionSteps) {
    try {
      // Check for existing step code
      const existing = await getProductionStepByCode(stepData.stepCode, ownerId);
      if (existing) {
        failed.push({
          rowNumber: stepData.rowNumber,
          field: 'stepCode',
          message: 'Production step code already exists',
          value: stepData.stepCode,
        });
        continue;
      }

      // Create production step
      const dbStep = await createProductionStepDb({
        ownerId,
        stepCode: stepData.stepCode,
        stepName: stepData.stepName,
        filmSequence: stepData.filmSequence,
        stepGroup: stepData.stepGroup,
        notes: stepData.notes,
      });

      const productionStep: ProductionStep = {
        id: dbStep.id,
        ownerId: dbStep.ownerId,
        stepCode: dbStep.stepCode,
        stepName: dbStep.stepName,
        filmSequence: dbStep.filmSequence,
        stepGroup: dbStep.stepGroup,
        notes: dbStep.notes,
        createdAt: dbStep.createdAt.toISOString(),
        updatedAt: dbStep.updatedAt.toISOString(),
      };

      successful.push(productionStep);
    } catch (error) {
      failed.push({
        rowNumber: stepData.rowNumber,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to create production step',
        value: stepData.stepCode,
      });
    }
  }

  return { successful, failed };
}
