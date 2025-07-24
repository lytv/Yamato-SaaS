/**
 * Satellite Progress Export API Route
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import { exportSatelliteProgress } from '@/libs/queries/satelliteProgress';
import { validateSatelliteProgressExportParams } from '@/libs/validations/satelliteProgress';
import type {
  SatelliteProgressErrorResponse,
} from '@/types/satelliteProgress';

/**
 * POST /api/satellite-progress/export
 * Export satellite progress data to Excel or CSV
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: SatelliteProgressErrorResponse = {
        success: false,
        error: 'Unauthorized access',
        code: 'UNAUTHORIZED',
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const exportParams = validateSatelliteProgressExportParams({
      ...body,
      ownerId: userId,
    });

    // Fetch data for export
    const data = await exportSatelliteProgress(exportParams);

    if (data.length === 0) {
      const errorResponse: SatelliteProgressErrorResponse = {
        success: false,
        error: 'No data available for export',
        code: 'NO_DATA',
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Prepare export data
    const exportData = data.map(item => {
      const baseData = {
        'Mã sản phẩm': item.product_code,
        'Tên sản phẩm': item.product_name,
        'Mã kế hoạch': item.plan_code,
        'Tên kế hoạch': item.plan_name,
        'Nhân viên vệ tinh': item.assigned_user_name,
        'Số lượng kế hoạch': item.planned_quantity,
        'Tổng hoàn thành': item.total_completed,
        'Tỷ lệ hoàn thành (%)': item.completion_rate,
      };

      // Add dynamic step columns
      const stepData: Record<string, number> = {};
      for (let i = 1; i <= 150; i++) {
        const stepCode = (item as any)[`step_code_${i}`];
        const stepName = (item as any)[`step_name_${i}`];
        const stepQuantity = (item as any)[`step_quantity_${i}`];
        
        if (stepCode && stepName && stepQuantity > 0) {
          stepData[`${stepName} (${stepCode})`] = stepQuantity;
        }
      }

      return { ...baseData, ...stepData };
    });

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = exportParams.filename || `satellite_progress_${timestamp}`;

    let buffer: Buffer;
    let mimeType: string;
    let fileExtension: string;

    if (exportParams.format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        exportParams.includeHeaders ? headers.join(',') : '',
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value || '');
            return stringValue.includes(',') || stringValue.includes('"') 
              ? `"${stringValue.replace(/"/g, '""')}"` 
              : stringValue;
          }).join(',')
        ),
      ].filter(Boolean).join('\n');

      buffer = Buffer.from(csvContent, 'utf-8');
      mimeType = 'text/csv';
      fileExtension = '.csv';
    } else {
      // Generate Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Satellite Progress');
      
      // Set column widths
      const maxWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(
          key.length,
          ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
        )
      }));
      worksheet['!cols'] = maxWidths;

      buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = '.xlsx';
    }

    // Create response with file download
    const response = new NextResponse(buffer);
    response.headers.set('Content-Type', mimeType);
    response.headers.set('Content-Disposition', `attachment; filename="${filename}${fileExtension}"`);
    response.headers.set('Content-Length', buffer.length.toString());

    return response;

  } catch (error) {
    console.error('Satellite progress export API error:', error);

    const errorResponse: SatelliteProgressErrorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}