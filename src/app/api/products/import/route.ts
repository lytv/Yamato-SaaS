/**
 * Product Import API Route
 * POST /api/products/import - Import products from Excel file
 * Following existing product API patterns and auth
 */

import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { createProduct as createProductDb, getProductByCode } from '@/libs/queries/product';
import type { ImportError } from '@/types/import';
import type { Product } from '@/types/product';
import { parseExcelFile, validateImportData } from '@/utils/excelImportHelpers';

// Force dynamic rendering due to auth() usage and file upload
export const dynamic = 'force-dynamic';

/**
 * POST /api/products/import - Import products from Excel file
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

    // Create products using existing createProduct function (loop approach)
    const ownerId = orgId || userId;
    const results = await processImportData(validation.validProducts, ownerId);

    return Response.json({
      success: true,
      data: {
        totalRows: importData.length,
        successCount: results.successful.length,
        errorCount: results.failed.length,
        createdProducts: results.successful,
        errors: [...validation.errors, ...results.failed],
      },
    });
  } catch (error) {
    console.error('Error importing products:', error);

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

// Helper function using existing createProduct in loop
async function processImportData(products: Array<{ productCode: string; productName: string; category?: string; notes?: string; rowNumber: number }>, ownerId: string): Promise<{
  successful: Product[];
  failed: ImportError[];
}> {
  const successful: Product[] = [];
  const failed: ImportError[] = [];

  for (const productData of products) {
    try {
      // Check for existing product code using existing function
      const existing = await getProductByCode(productData.productCode, ownerId);
      if (existing) {
        failed.push({
          rowNumber: productData.rowNumber,
          field: 'productCode',
          message: 'Product code already exists',
          value: productData.productCode,
        });
        continue;
      }

      // Create product using existing database function
      const dbProduct = await createProductDb({
        ownerId,
        productCode: productData.productCode,
        productName: productData.productName,
        category: productData.category,
        notes: productData.notes,
      });

      // Transform database product to API product type
      const product: Product = {
        id: dbProduct.id,
        ownerId: dbProduct.ownerId,
        productCode: dbProduct.productCode,
        productName: dbProduct.productName,
        category: dbProduct.category,
        notes: dbProduct.notes,
        createdAt: dbProduct.createdAt.toISOString(),
        updatedAt: dbProduct.updatedAt.toISOString(),
      };

      successful.push(product);
    } catch (error) {
      failed.push({
        rowNumber: productData.rowNumber,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to create product',
        value: productData.productCode,
      });
    }
  }

  return { successful, failed };
}
