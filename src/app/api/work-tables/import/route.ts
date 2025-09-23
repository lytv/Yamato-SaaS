/**
 * Work Table Import API Route
 * POST /api/work-tables/import - Import work tables from YMT Plan Excel file
 */

import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { createWorkTable, getWorkTableByCode } from '@/libs/queries/workTable';
import type { ImportError } from '@/types/import';
import type { WorkTable } from '@/types/workTable';
import { parseYmtPlanExcelFile, validateWorkTableImportData } from '@/utils/excelImportHelpers';

// Force dynamic rendering due to auth() usage and file upload
export const dynamic = 'force-dynamic';

/**
 * POST /api/work-tables/import - Import work tables from Excel file
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
    const importData = await parseYmtPlanExcelFile(buffer);

    // Validate data
    const validation = validateWorkTableImportData(importData);

    // Create work tables
    const ownerId = orgId || userId;
    const results = await processImportData(validation.validWorkTables, ownerId);

    return Response.json({
      success: true,
      data: {
        totalRows: importData.length,
        successCount: results.successful.length,
        errorCount: results.failed.length,
        skippedCount: results.skipped,
        createdWorkTables: results.successful,
        errors: [...validation.errors, ...results.failed],
      },
    });
  } catch (error) {
    console.error('Error importing work tables:', error);

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
async function processImportData(workTables: Array<{ tableCode: string; tableName: string; tableDetail?: string; tableType: string; rowNumber: number }>, ownerId: string): Promise<{
  successful: WorkTable[];
  failed: ImportError[];
  skipped: number;
}> {
  const successful: WorkTable[] = [];
  const failed: ImportError[] = [];
  let skipped = 0;

  for (const workTableData of workTables) {
    try {
      // Check for existing work table code
      const existing = await getWorkTableByCode(workTableData.tableCode, ownerId);
      if (existing) {
        // Skip if already exists
        skipped++;
        continue;
      }

      // Create work table using existing database function
      const dbWorkTable = await createWorkTable({
        ownerId,
        tableCode: workTableData.tableCode,
        tableName: workTableData.tableName,
        tableDetail: workTableData.tableDetail,
        tableType: workTableData.tableType as any,
      });

      // Transform database work table to API work table type
      const workTable: WorkTable = {
        id: dbWorkTable.id,
        ownerId: dbWorkTable.ownerId,
        tableCode: dbWorkTable.tableCode,
        tableName: dbWorkTable.tableName,
        tableDetail: dbWorkTable.tableDetail,
        tableType: dbWorkTable.tableType as any,
        tableCategory: dbWorkTable.tableCategory,
        capacityPerDay: dbWorkTable.capacityPerDay,
        capacityPerHour: dbWorkTable.capacityPerHour,
        tableSizeLength: dbWorkTable.tableSizeLength,
        tableSizeWidth: dbWorkTable.tableSizeWidth,
        locationCode: dbWorkTable.locationCode,
        department: dbWorkTable.department,
        assignedOperator: dbWorkTable.assignedOperator,
        supervisor: dbWorkTable.supervisor,
        status: dbWorkTable.status as any,
        availabilitySchedule: dbWorkTable.availabilitySchedule,
        lastMaintenanceDate: dbWorkTable.lastMaintenanceDate,
        nextMaintenanceDate: dbWorkTable.nextMaintenanceDate,
        equipmentModel: dbWorkTable.equipmentModel,
        installationDate: dbWorkTable.installationDate,
        warrantyExpiryDate: dbWorkTable.warrantyExpiryDate,
        utilizationRate: dbWorkTable.utilizationRate,
        efficiencyRating: dbWorkTable.efficiencyRating,
        totalProcessedUnits: dbWorkTable.totalProcessedUnits,
        specialCapabilities: dbWorkTable.specialCapabilities,
        limitations: dbWorkTable.limitations,
        note: dbWorkTable.note,
        createdAt: dbWorkTable.createdAt.toISOString(),
        updatedAt: dbWorkTable.updatedAt.toISOString(),
      };

      successful.push(workTable);
    } catch (error) {
      failed.push({
        rowNumber: workTableData.rowNumber,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to create work table',
        value: workTableData.tableCode,
      });
    }
  }

  return { successful, failed, skipped };
}
