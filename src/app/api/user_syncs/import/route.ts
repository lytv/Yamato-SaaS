/**
 * UserSync Import API Route
 * POST /api/user_syncs/import - Import user_syncs from Excel file
 * Following existing user_sync API patterns and auth
 */

import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { createUserSync as createUserSyncDb, getUserSyncByUserId } from '@/libs/queries/user_sync';
import type { ImportError } from '@/types/import';
import type { UserSync } from '@/types/user_sync';
import { parseUserSyncExcelFile, validateUserSyncImportData } from '@/utils/excelImportHelpers';

// Force dynamic rendering due to auth() usage and file upload
export const dynamic = 'force-dynamic';

/**
 * POST /api/user_syncs/import - Import user_syncs from Excel file
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
    const importData = await parseUserSyncExcelFile(buffer);

    // Validate data using existing schemas
    const validation = validateUserSyncImportData(importData);

    // Create user_syncs using existing createUserSync function (loop approach)
    const ownerId = orgId || userId;
    const results = await processImportData(validation.validUserSyncs, ownerId);

    return Response.json({
      success: true,
      data: {
        totalRows: importData.length,
        successCount: results.successful.length,
        errorCount: results.failed.length,
        createdUserSyncs: results.successful,
        errors: [...validation.errors, ...results.failed],
      },
    });
  } catch (error) {
    console.error('Error importing user_syncs:', error);

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

// Helper function using existing createUserSync in loop
async function processImportData(user_syncs: Array<{ userId: string; email: string; fullName?: string; role?: string; organizationRole?: string; isActive?: boolean; rowNumber: number }>, ownerId: string): Promise<{
  successful: UserSync[];
  failed: ImportError[];
}> {
  const successful: UserSync[] = [];
  const failed: ImportError[] = [];

  for (const user_syncData of user_syncs) {
    try {
      // Check for existing user_sync using userId
      const existing = await getUserSyncByUserId(user_syncData.userId, ownerId);
      if (existing) {
        failed.push({
          rowNumber: user_syncData.rowNumber,
          field: 'userId',
          message: 'User already exists',
          value: user_syncData.userId,
        });
        continue;
      }

      // Create user_sync using existing database function
      const dbUserSync = await createUserSyncDb({
        ownerId,
        userId: user_syncData.userId,
        email: user_syncData.email,
        fullName: user_syncData.fullName,
        role: user_syncData.role,
        organizationRole: user_syncData.organizationRole,
        isActive: user_syncData.isActive,
      });

      // Transform database user_sync to API user_sync type
      const user_sync: UserSync = {
        userId: dbUserSync.userId,
        ownerId: dbUserSync.ownerId,
        email: dbUserSync.email,
        fullName: dbUserSync.fullName,
        avatarUrl: dbUserSync.avatarUrl,
        role: dbUserSync.role,
        organizationRole: dbUserSync.organizationRole,
        isActive: dbUserSync.isActive,
        createdAt: dbUserSync.createdAt.toISOString(),
        updatedAt: dbUserSync.updatedAt.toISOString(),
      };

      successful.push(user_sync);
    } catch (error) {
      failed.push({
        rowNumber: user_syncData.rowNumber,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to create user_sync',
        value: user_syncData.userId,
      });
    }
  }

  return { successful, failed };
}
