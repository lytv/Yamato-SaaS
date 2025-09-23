/**
 * Price Summary Export API Route
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import { exportPriceSummary } from '@/libs/queries/priceSummary';
import { validatePriceSummaryFiltersWithOwner } from '@/libs/validations/priceSummary';
import type {
  PriceSummaryErrorResponse,
  PriceSummaryItem,
} from '@/types/priceSummary';

/**
 * GET /api/price-summary/export
 * Export price summary data to Excel or CSV
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: PriceSummaryErrorResponse = {
        success: false,
        error: 'Unauthorized access',
        code: 'UNAUTHORIZED',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || undefined,
      product_code: searchParams.get('product_code') || undefined,
      price_type: searchParams.get('price_type') || 'factory_price',
      show_only_with_pricing: searchParams.get('show_only_with_pricing') === 'true' || false,
      sortBy: searchParams.get('sortBy') || 'product_code',
      sortOrder: searchParams.get('sortOrder') || 'asc',
      ownerId: userId,
    };

    const format = searchParams.get('format') || 'xlsx';
    const includeHeaders = searchParams.get('includeHeaders') !== 'false';
    const filename = searchParams.get('filename') || `price_summary_${new Date().toISOString().slice(0, 10)}`;

    // Validate filters
    const validatedFilters = validatePriceSummaryFiltersWithOwner(filters);

    // Fetch data for export
    const data = await exportPriceSummary(validatedFilters);

    if (data.length === 0) {
      const errorResponse: PriceSummaryErrorResponse = {
        success: false,
        error: 'No data available for export',
        code: 'NO_DATA',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Prepare export data with dynamic columns
    const exportData = prepareExportData(data, includeHeaders);

    // Generate file based on format
    let fileBuffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === 'csv') {
      fileBuffer = generateCSV(exportData);
      contentType = 'text/csv';
      fileExtension = 'csv';
    } else {
      fileBuffer = generateExcel(exportData);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    }

    const finalFilename = `${filename}.${fileExtension}`;

    // Return file as response
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Price summary export API error:', error);

    const errorResponse: PriceSummaryErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Prepare data for export with dynamic step columns
 */
function prepareExportData(data: PriceSummaryItem[], includeHeaders: boolean): any[][] {
  if (data.length === 0) {
    return [];
  }

  // Collect all unique step codes across all products
  const allStepCodes = new Set<string>();
  data.forEach((item) => {
    Object.keys(item.step_data).forEach((stepCode) => {
      allStepCodes.add(stepCode);
    });
  });

  // Sort step codes numerically
  const sortedStepCodes = Array.from(allStepCodes).sort((a, b) => {
    const getNumericPart = (code: string) => {
      const match = code.match(/\d+/);
      return match ? Number.parseInt(match[0], 10) : 0;
    };
    return getNumericPart(a) - getNumericPart(b);
  });

  const rows: any[][] = [];

  // Add headers if requested
  if (includeHeaders) {
    const headers = [
      'Mã sản phẩm',
      'Tên sản phẩm',
      ...sortedStepCodes.map((stepCode) => {
        const firstItemWithStep = data.find(item => item.step_data[stepCode]);
        return firstItemWithStep?.step_data[stepCode]?.step_name || stepCode;
      }),
      'Tổng số công đoạn',
      'Tổng giá trị',
    ];
    rows.push(headers);
  }

  // Add data rows
  data.forEach((item) => {
    const row = [
      item.product_code,
      item.product_name,
      ...sortedStepCodes.map((stepCode) => {
        const stepData = item.step_data[stepCode];
        return stepData ? stepData.price : 0;
      }),
      item.total_steps,
      item.total_price,
    ];
    rows.push(row);
  });

  return rows;
}

/**
 * Generate Excel file buffer
 */
function generateExcel(data: any[][]): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  // Set column widths
  const columnWidths = data[0]?.map((_, index) => {
    if (index === 0 || index === 1) {
      return { wch: 20 };
    } // Product code/name
    if (data[0] && index >= data[0].length - 2) {
      return { wch: 15 };
    } // Total columns
    return { wch: 12 }; // Step columns
  }) || [];
  worksheet['!cols'] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tổng Hợp Đơn Giá');

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

/**
 * Generate CSV file buffer
 */
function generateCSV(data: any[][]): Buffer {
  const csvContent = data
    .map(row =>
      row.map((cell) => {
        const cellStr = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','),
    )
    .join('\n');

  // Add BOM for Excel UTF-8 support
  return Buffer.from(`\uFEFF${csvContent}`, 'utf8');
}
