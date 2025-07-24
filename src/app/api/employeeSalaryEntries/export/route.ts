/**
 * Employee Salary Entries Export API Route
 * Following Yamato-SaaS patterns and Excel export standards
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import { getEmployeeSalaryEntries } from '@/libs/queries/employeeSalaryEntry';
import { validateEmployeeSalaryEntryListParams } from '@/libs/validations/employeeSalaryEntry';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse parameters
    const params = validateEmployeeSalaryEntryListParams({
      page: 1, // Export all data
      limit: 10000, // Large limit for export
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      includeRelations: true, // Always include relations for export
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      userId: searchParams.get('userId') || undefined,
      productionStepDetailId: searchParams.get('productionStepDetailId') ? Number(searchParams.get('productionStepDetailId')) : undefined,
      planId: searchParams.get('planId') ? Number(searchParams.get('planId')) : undefined,
      productId: searchParams.get('productId') ? Number(searchParams.get('productId')) : undefined,
    });

    const employeeSalaryEntries = await getEmployeeSalaryEntries({
      ...params,
      owner_id: orgId || userId,
    });

    // Transform data for Excel export
    const exportData = employeeSalaryEntries.map((entry: any) => ({
      'Employee Name': entry.userSync?.fullName || entry.userSync?.shortcut || 'N/A',
      'Product Name': entry.product?.productName || 'N/A',
      'Product Code': entry.product?.productCode || 'N/A',
      'Step Name': (entry.productionStepDetail as any)?.stepName || 'N/A',
      'Step Code': (entry.productionStepDetail as any)?.stepCode || 'N/A',
      'Work Date': entry.workDate ? new Date(entry.workDate).toLocaleDateString() : 'N/A',
      'Entry Date': entry.entryDate ? new Date(entry.entryDate).toLocaleDateString() : 'N/A',
      'Actual Quantity': entry.actualQuantity || 0,
      'Planned Quantity': entry.plannedQuantity || 0,
      'Limit Quantity': entry.limitQuantity || 0,
      'Unit Price': entry.unitPrice || 0,
      'Total Amount': entry.totalAmount || 0,
      'Status': entry.status || 'N/A',
      'Created At': new Date(entry.createdAt).toLocaleString(),
      'Updated At': new Date(entry.updatedAt).toLocaleString(),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Employee Name
      { wch: 25 }, // Product Name
      { wch: 15 }, // Product Code
      { wch: 25 }, // Step Name
      { wch: 15 }, // Step Code
      { wch: 12 }, // Work Date
      { wch: 12 }, // Entry Date
      { wch: 12 }, // Actual Quantity
      { wch: 12 }, // Planned Quantity
      { wch: 12 }, // Limit Quantity
      { wch: 12 }, // Unit Price
      { wch: 15 }, // Total Amount
      { wch: 10 }, // Status
      { wch: 18 }, // Created At
      { wch: 18 }, // Updated At
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Salary Entries');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `employee-salary-entries-${timestamp}.xlsx`;

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting employee salary entries:', error);
    return NextResponse.json(
      { error: 'Failed to export employee salary entries' },
      { status: 500 }
    );
  }
}