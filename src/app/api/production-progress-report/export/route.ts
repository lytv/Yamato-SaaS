/**
 * Production Progress Report Export API Route - GET
 * Following TDD Workflow Standards and Yamato-SaaS patterns
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { ZodError } from 'zod';

import { exportProductionProgressReport } from '@/libs/queries/productionProgressReport';
import { validateProductionProgressReportExportParams } from '@/libs/validations/productionProgressReport';
import type { ProductionProgressReportFiltersWithOwner } from '@/types/productionProgressReport';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // ✅ CRITICAL: Handle both sync/async auth
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // ✅ CRITICAL: Convert null to undefined (400 fix)
    const queryParams = {
      search: searchParams.get('search') || undefined,
      plan_code: searchParams.get('plan_code') || undefined,
      product_code: searchParams.get('product_code') || undefined,
      production_step_code: searchParams.get('production_step_code') || undefined,
      report_type: searchParams.get('report_type') || undefined,
      format: searchParams.get('format') || undefined,
      includeHeaders: searchParams.get('includeHeaders') === 'true',
      filename: searchParams.get('filename') || undefined,
    };

    // ✅ Validation with proper error handling
    const validatedParams = validateProductionProgressReportExportParams(queryParams);

    // Add ownerId to the validated params
    const paramsWithOwner: ProductionProgressReportFiltersWithOwner = {
      ...validatedParams,
      ownerId: orgId || userId,
    };

    const data = await exportProductionProgressReport(paramsWithOwner);

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const filename = validatedParams.filename || `production_progress_report_${timestamp}`;

    if (validatedParams.format === 'csv') {
      // Generate CSV
      let csvContent = '';
      
      if (validatedParams.includeHeaders) {
        csvContent += 'Report Type,Entity ID,Entity Name,Plan Code,Product Code,Product Name,Step Code,Step Name,Total Planned,Total Actual,Total Assigned,Total Received,Total Defect,Total Made,Completion Rate,Remaining Quantity\n';
      }

      data.forEach(item => {
        csvContent += [
          item.report_type,
          item.entity_id,
          `"${item.entity_name}"`,
          item.plan_code,
          item.product_code,
          `"${item.product_name}"`,
          item.step_code,
          `"${item.step_name}"`,
          item.total_planned,
          item.total_actual,
          item.total_assigned,
          item.total_received,
          item.total_defect,
          item.total_made,
          item.completion_rate,
          item.remaining_quantity,
        ].join(',') + '\n';
      });

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // Generate Excel
      const worksheetData = [];
      
      if (validatedParams.includeHeaders) {
        worksheetData.push([
          'Report Type',
          'Entity ID', 
          'Entity Name',
          'Plan Code',
          'Product Code',
          'Product Name',
          'Step Code',
          'Step Name',
          'Total Planned',
          'Total Actual',
          'Total Assigned',
          'Total Received',
          'Total Defect',
          'Total Made',
          'Completion Rate',
          'Remaining Quantity',
        ]);
      }

      data.forEach(item => {
        worksheetData.push([
          item.report_type,
          item.entity_id,
          item.entity_name,
          item.plan_code,
          item.product_code,
          item.product_name,
          item.step_code,
          item.step_name,
          item.total_planned,
          item.total_actual,
          item.total_assigned,
          item.total_received,
          item.total_defect,
          item.total_made,
          item.completion_rate,
          item.remaining_quantity,
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Production Progress Report');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new Response(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting production progress report:', error);

    if (error instanceof ZodError) {
      return Response.json(
        {
          success: false,
          error: 'Invalid export parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('stored procedure')) {
        return Response.json(
          { success: false, error: 'Database query failed', code: 'DATABASE_ERROR' },
          { status: 500 },
        );
      }

      if (error.message.includes('Failed to fetch')) {
        return Response.json(
          { success: false, error: 'Unable to export data', code: 'EXPORT_ERROR' },
          { status: 500 },
        );
      }
    }

    return Response.json(
      { success: false, error: 'Export failed', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}