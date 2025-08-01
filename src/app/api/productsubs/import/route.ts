/**
 * ProductSub Import API Route
 * POST /api/productsubs/import - Import product_subs from YMT Plan Excel file
 */

import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { createProductSub, getProductSubByCode } from '@/libs/queries/productsub';
import { getProductByName } from '@/libs/queries/product';
import type { ImportError } from '@/types/import';
import type { ProductSub } from '@/types/productsub';
import { parseYmtPlanForProductSub, validateProductSubImportData, type ImportProductSubData } from '@/utils/excelImportHelpers';

// Force dynamic rendering due to auth() usage and file upload
export const dynamic = 'force-dynamic';

/**
 * POST /api/productsubs/import - Import product_subs from Excel file
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
    const importData = await parseYmtPlanForProductSub(buffer);

    // Validate data
    const validation = validateProductSubImportData(importData);

    // Create product_subs
    const ownerId = orgId || userId;
    const results = await processImportData(validation.validProductSubs, ownerId);

    return Response.json({
      success: true,
      data: {
        totalRows: importData.length,
        successCount: results.successful.length,
        errorCount: results.failed.length,
        skippedCount: results.skipped,
        createdProductSubs: results.successful,
        errors: [...validation.errors, ...results.failed],
      },
    });
  } catch (error) {
    console.error('Error importing product_subs:', error);

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
async function processImportData(productSubs: ImportProductSubData[], ownerId: string): Promise<{
  successful: ProductSub[];
  failed: ImportError[];
  skipped: number;
}> {
  const successful: ProductSub[] = [];
  const failed: ImportError[] = [];
  let skipped = 0;

  for (const productSubData of productSubs) {
    try {
      // Get product by name
      const product = await getProductByName(productSubData.productName, ownerId);
      if (!product) {
        failed.push({
          rowNumber: productSubData.rowNumber,
          field: 'productName',
          message: `Product not found: ${productSubData.productName}`,
          value: productSubData.productName,
        });
        continue;
      }

      // Generate product_sub_code: First letter of product name + sequence number
      const firstLetter = productSubData.productName.charAt(0).toUpperCase();
      const sequenceNumber = Math.floor(Math.random() * 1000) + 1; // You might want to implement proper sequence logic
      const productSubCode = `${firstLetter}_${sequenceNumber.toString().padStart(3, '0')}`;

      // Check for existing product_sub code (with retry logic for uniqueness)
      let finalProductSubCode = productSubCode;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        const existing = await getProductSubByCode(finalProductSubCode, ownerId);
        if (!existing) {
          break;
        }
        attempts++;
        const newSequence = Math.floor(Math.random() * 1000) + attempts * 100;
        finalProductSubCode = `${firstLetter}_${newSequence.toString().padStart(3, '0')}`;
      }

      if (attempts >= maxAttempts) {
        failed.push({
          rowNumber: productSubData.rowNumber,
          field: 'productSubCode',
          message: 'Unable to generate unique product_sub_code after multiple attempts',
          value: productSubCode,
        });
        continue;
      }

      // Extract sub_category from product_sub_detail (first two letters)
      const subCategory = productSubData.productSubDetail.substring(0, 2).toUpperCase();

      // Create product_sub using existing database function
      const createData = {
        ownerId,
        productId: product.id,
        productsubCode: finalProductSubCode,
        productsubName: productSubData.productSubDetail,
        category: subCategory,
        notes: `Imported from YMT Plan`,
      };
      
      const dbProductSub = await createProductSub(createData);

      // Transform database product_sub to API product_sub type
      const productSub: ProductSub = {
        id: dbProductSub.id,
        ownerId: dbProductSub.ownerId,
        productId: dbProductSub.productId,
        productCode: dbProductSub.productCode,
        productSubCode: dbProductSub.productSubCode,
        productSubDetail: dbProductSub.productSubDetail,
        subCategory: dbProductSub.subCategory,
        colorCode: dbProductSub.colorCode,
        barcode: dbProductSub.barcode,
        description: dbProductSub.description,
        note: dbProductSub.note,
        createdAt: dbProductSub.createdAt.toISOString(),
        updatedAt: dbProductSub.updatedAt.toISOString(),
      };

      successful.push(productSub);
    } catch (error) {
      failed.push({
        rowNumber: productSubData.rowNumber,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to create product_sub',
        value: productSubData.productSubDetail,
      });
    }
  }

  return { successful, failed, skipped };
}
