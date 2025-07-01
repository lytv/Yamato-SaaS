/**
 * ProductSub Import API Route
 * POST /api/productsubsubs/import - Import productsubsubs from Excel file
 * Following existing productsubsub API patterns and auth
 */

import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { createProductSub as createProductSubDb, getProductSubByCode } from '@/libs/queries/productsub';
import type { ImportError } from '@/types/import';
import type { ProductSub } from '@/types/productsub';
import { parseExcelFile, validateImportData } from '@/utils/excelImportHelpers';

// Force dynamic rendering due to auth() usage and file upload
export const dynamic = 'force-dynamic';

/**
 * POST /api/productsubsubs/import - Import productsubsubs from Excel file
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
    const importData = await parseExcelFile(buffer);

    // Validate data using existing schemas
    const validation = validateImportData(importData);

    // Create productsubsubs using existing createProductSub function (loop approach)
    const ownerId = orgId || userId;
    const mappedProductSubs = validation.validProducts.map(item => ({
      productsubCode: item.productCode,
      productsubName: item.productName,
      category: item.category,
      notes: item.notes,
      rowNumber: item.rowNumber,
      productId: 1,
    }));
    const results = await processImportData(mappedProductSubs, ownerId);

    return Response.json({
      success: true,
      data: {
        totalRows: importData.length,
        successCount: results.successful.length,
        errorCount: results.failed.length,
        createdProductSubs: results.successful,
        errors: [...validation.errors, ...results.failed],
      },
    });
  } catch (error) {
    console.error('Error importing productsubsubs:', error);

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

// Helper function using existing createProductSub in loop
async function processImportData(productsubs: Array<{ productsubCode: string; productsubName: string; category?: string; notes?: string; rowNumber: number; productId: number }>, ownerId: string): Promise<{
  successful: ProductSub[];
  failed: ImportError[];
}> {
  const successful: ProductSub[] = [];
  const failed: ImportError[] = [];

  for (const productsubData of productsubs) {
    try {
      // Check for existing productsub code using existing function
      const existing = await getProductSubByCode(productsubData.productsubCode, ownerId);
      if (existing) {
        failed.push({
          rowNumber: productsubData.rowNumber,
          field: 'productsubCode',
          message: 'ProductSub code already exists',
          value: productsubData.productsubCode,
        });
        continue;
      }

      // Create productsub using existing database function
      const dbProductSub = await createProductSubDb({
        ownerId,
        productId: productsubData.productId ?? 1,
        productsubCode: productsubData.productsubCode,
        productsubName: productsubData.productsubName,
        category: productsubData.category,
        notes: productsubData.notes,
      });

      // Transform database productsub to API productsub type
      const productsub: ProductSub = {
        id: dbProductSub.id,
        ownerId: dbProductSub.ownerId,
        productCode: dbProductSub.productCode,
        productId: dbProductSub.productId,
        productSubCode: dbProductSub.productSubCode,
        productSubDetail: dbProductSub.productSubDetail,
        subCategory: dbProductSub.subCategory,
        colorCode: dbProductSub.colorCode,
        barcode: dbProductSub.barcode,
        description: dbProductSub.description,
        note: dbProductSub.note,
        createdAt: dbProductSub.createdAt,
        updatedAt: dbProductSub.updatedAt,
      };

      successful.push(productsub);
    } catch (error) {
      failed.push({
        rowNumber: productsubData.rowNumber,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to create productsub',
        value: productsubData.productsubCode,
      });
    }
  }

  return { successful, failed };
}
