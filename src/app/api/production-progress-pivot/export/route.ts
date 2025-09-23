/**
 * Production Progress Pivot Export API Route
 * Following TDD Workflow Standards and Yamato-SaaS patterns
 */

import { Buffer } from 'node:buffer';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';

import { exportProductionProgressPivot } from '@/libs/queries/productionProgressPivot';
import { validateProductionProgressPivotExportParams } from '@/libs/validations/productionProgressPivot';
import type { ProductionProgressPivotFiltersWithOwner } from '@/types/productionProgressPivot';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const queryParams = {
      search: searchParams.get('search') || undefined,
      product_code: searchParams.get('product_code') || undefined,
      plan_code: searchParams.get('plan_code') || undefined,
      format: searchParams.get('format') || 'xlsx',
      includeHeaders: searchParams.get('includeHeaders') !== 'false',
      filename: searchParams.get('filename') || undefined,
    };

    const validatedParams = validateProductionProgressPivotExportParams(queryParams);

    const paramsWithOwner: ProductionProgressPivotFiltersWithOwner = {
      ...validatedParams,
      ownerId: orgId || userId,
    };

    const data = await exportProductionProgressPivot(paramsWithOwner);

    if (data.length === 0) {
      return Response.json(
        { success: false, error: 'No data to export', code: 'NO_DATA' },
        { status: 404 },
      );
    }

    // Prepare export data with dynamic step columns
    const exportData = data.map((item) => {
      const baseData = {
        'Tên sản phẩm': item.product_name,
        'Mã kế hoạch': item.plan_code,
        'Tên kế hoạch': item.plan_name,
        'SL kế hoạch': item.planned_quantity,
      };

      // Add dynamic step columns
      const stepData: Record<string, number> = {};
      for (let i = 1; i <= 5; i++) {
        const stepName = item[`step_name_${i}` as keyof typeof item] as string | null;
        const stepQuantity = item[`step_quantity_${i}` as keyof typeof item] as number;

        if (stepName) {
          stepData[stepName] = stepQuantity;
        }
      }

      const endData = {
        'Tổng hoàn thành': item.total_completed,
      };

      return { ...baseData, ...stepData, ...endData };
    });

    let filename = validatedParams.filename || 'production_progress_pivot';
    const timestamp = new Date().toISOString().slice(0, 10);

    if (validatedParams.format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        validatedParams.includeHeaders ? headers.join(',') : '',
        ...exportData.map(row =>
          headers.map((header) => {
            const value = (row as Record<string, any>)[header];
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(','),
        ),
      ].filter(Boolean).join('\n');

      filename = filename.includes('.') ? filename : `${filename}_${timestamp}.csv`;

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      // Generate Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Production Progress Pivot');

      // Auto-fit columns
      const cols = Object.keys(exportData[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
      worksheet['!cols'] = cols;

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      filename = filename.includes('.') ? filename : `${filename}_${timestamp}.xlsx`;

      return new Response(Buffer.from(excelBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': excelBuffer.length.toString(),
          'Cache-Control': 'no-cache',
        },
      });
    }
  } catch (error) {
    console.error('Error exporting production progress pivot:', error);

    if (error instanceof Error) {
      if (error.message.includes('Validation')) {
        return Response.json(
          { success: false, error: 'Invalid export parameters', code: 'VALIDATION_ERROR' },
          { status: 400 },
        );
      }

      if (error.message.includes('stored procedure')) {
        return Response.json(
          { success: false, error: 'Database query failed', code: 'DATABASE_ERROR' },
          { status: 500 },
        );
      }
    }

    return Response.json(
      { success: false, error: 'Export failed', code: 'EXPORT_ERROR' },
      { status: 500 },
    );
  }
}
