/**
 * Employee Delivery Receipt Inventory Export API Routes - GET
 * Following TDD Workflow Standards and Yamato-SaaS patterns
 * Provides Excel/CSV export functionality
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { ZodError } from 'zod';

import { exportEmployeeDeliveryReceiptInventory } from '@/libs/queries/employeeDeliveryReceiptInventory';
import { validateEmployeeDeliveryReceiptInventoryExportParams } from '@/libs/validations/employeeDeliveryReceiptInventory';
import type { EmployeeDeliveryReceiptInventoryFiltersWithOwner } from '@/types/employeeDeliveryReceiptInventory';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // ✅ CRITICAL: Handle both sync/async auth (from debug guide)
    const { userId, orgId } = await auth();

    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    // Handle both NextRequest (runtime) and Request (testing)
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // ✅ CRITICAL: Convert null to undefined (400 fix)
    const queryParams = {
      search: searchParams.get('search') || undefined,
      plan_code: searchParams.get('plan_code') || undefined,
      product_code: searchParams.get('product_code') || undefined,
      production_step_code: searchParams.get('production_step_code') || undefined,
      employee_id: searchParams.get('employee_id') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
      format: searchParams.get('format') || undefined,
      includeHeaders: searchParams.get('includeHeaders') === 'true',
      filename: searchParams.get('filename') || undefined,
    };

    // ✅ Validation with proper error handling
    const validatedParams = validateEmployeeDeliveryReceiptInventoryExportParams(queryParams);

    // Add ownerId to the validated params
    const paramsWithOwner: EmployeeDeliveryReceiptInventoryFiltersWithOwner = {
      ...validatedParams,
      ownerId: orgId || userId,
    };

    // Get all data for export
    const data = await exportEmployeeDeliveryReceiptInventory(paramsWithOwner);

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const filename = validatedParams.filename || `employee-delivery-receipt-inventory-${timestamp}.${validatedParams.format}`;

    if (validatedParams.format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Employee ID',
        'Employee Name',
        'Plan Code',
        'Product Code',
        'Product Name',
        'Step Code',
        'Step Name',
        'Total Assigned',
        'Total Received',
        'Total Defect',
        'Total Rework',
        'Current Inventory',
        'Completion Rate (%)',
      ];

      const csvRows = data.map(item => [
        item.employee_id,
        item.employee_name,
        item.plan_code,
        item.product_code,
        item.product_name,
        item.step_code,
        item.step_name,
        item.total_assigned,
        item.total_received,
        item.total_defect,
        item.total_rework,
        item.current_inventory,
        item.completion_rate.toFixed(2),
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Generate Excel
      const worksheetData = [
        [
          'Employee ID',
          'Employee Name',
          'Plan Code',
          'Product Code',
          'Product Name',
          'Step Code',
          'Step Name',
          'Total Assigned',
          'Total Received',
          'Total Defect',
          'Total Rework',
          'Current Inventory',
          'Completion Rate (%)',
        ],
        ...data.map(item => [
          item.employee_id,
          item.employee_name,
          item.plan_code,
          item.product_code,
          item.product_name,
          item.step_code,
          item.step_name,
          item.total_assigned,
          item.total_received,
          item.total_defect,
          item.total_rework,
          item.current_inventory,
          Number(item.completion_rate.toFixed(2)),
        ]),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Data');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting employee delivery receipt inventory:', error);

    if (error instanceof ZodError) {
      return Response.json(
        {
          success: false,
          error: 'Invalid export parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
          validationErrors: error.errors.reduce((acc, err) => {
            const field = err.path.join('.');
            if (!acc[field]) {
              acc[field] = [];
            }
            acc[field].push(err.message);
            return acc;
          }, {} as Record<string, string[]>),
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      // Handle specific database or business logic errors
      if (error.message.includes('Failed to fetch')) {
        return Response.json(
          { success: false, error: 'Unable to retrieve data for export', code: 'FETCH_ERROR' },
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
