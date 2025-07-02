/**
 * Process Import API Route
 * POST /api/processes/import - Import processes from Excel file
 * Following existing process API patterns and auth
 */

import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { createProcess as createProcessDb, getProcessByCode } from '@/libs/queries/process';
import type { ImportError } from '@/types/import';
import type { Process } from '@/types/process';
import { parseProcessExcelFile, validateProcessImportData } from '@/utils/excelImportHelpers';

// Force dynamic rendering due to auth() usage and file upload
export const dynamic = 'force-dynamic';

/**
 * POST /api/processes/import - Import processes from Excel file
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

    // Parse Excel using existing utilities
    const buffer = Buffer.from(await file.arrayBuffer());
    const importData = await parseProcessExcelFile(buffer);

    // Validate data using process-specific schema
    const validation = validateProcessImportData(importData);

    // Create processes using existing createProcess function (loop approach)
    const ownerId = orgId || userId;
    const results = await processImportData(validation.validProcesses, ownerId);

    return Response.json({
      success: true,
      data: {
        totalRows: importData.length,
        successCount: results.successful.length,
        errorCount: results.failed.length,
        createdProcesss: results.successful,
        errors: [...validation.errors, ...results.failed],
      },
    });
  } catch (error) {
    console.error('Error importing processes:', error);

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

// Helper function using existing createProcess in loop
async function processImportData(processs: Array<{ processCode: string; processName: string; processCategory?: string; description?: string; rowNumber: number }>, ownerId: string): Promise<{
  successful: Process[];
  failed: ImportError[];
}> {
  const successful: Process[] = [];
  const failed: ImportError[] = [];

  for (const processData of processs) {
    try {
      // Check for existing process code using existing function
      const existing = await getProcessByCode(processData.processCode, ownerId);
      if (existing) {
        failed.push({
          rowNumber: processData.rowNumber,
          field: 'processCode',
          message: 'Process code already exists',
          value: processData.processCode,
        });
        continue;
      }

      // Create process using existing database function
      const dbProcess = await createProcessDb({
        ownerId,
        processCode: processData.processCode,
        processName: processData.processName,
        processCategory: processData.processCategory,
        description: processData.description,
      });

      // Transform database process to API process type
      const process: Process = {
        id: dbProcess.id,
        ownerId: dbProcess.ownerId,
        processCode: dbProcess.processCode,
        processName: dbProcess.processName,
        processCategory: dbProcess.processCategory,
        processType: dbProcess.processType,
        department: dbProcess.department,
        description: dbProcess.description,
        createdAt: dbProcess.createdAt.toISOString(),
        updatedAt: dbProcess.updatedAt.toISOString(),
      };

      successful.push(process);
    } catch (error) {
      failed.push({
        rowNumber: processData.rowNumber,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to create process',
        value: processData.processCode,
      });
    }
  }

  return { successful, failed };
}
