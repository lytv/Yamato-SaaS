/**
 * OutsourceOrderDetail Export API Route
 * Provides Excel and CSV export functionality
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getOutsourceOrderDetailsByOwner } from '@/libs/queries/outsourceOrderDetail';
import { validateOutsourceOrderDetailExportParams } from '@/libs/validations/outsourceOrderDetail';

// GET /api/outsourceOrderDetails/export
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawParams = {
      page: 1,
      limit: 999999,
      format: searchParams.get('format') || 'xlsx',
      includeHeaders: searchParams.get('includeHeaders') !== 'false',
      filename: searchParams.get('filename') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      outsourceOrderId: searchParams.get('outsourceOrderId') ? Number(searchParams.get('outsourceOrderId')) : undefined,
      status: searchParams.get('status') || undefined,
      planId: searchParams.get('planId') ? Number(searchParams.get('planId')) : undefined,
      productId: searchParams.get('productId') ? Number(searchParams.get('productId')) : undefined,
      productionStepId: searchParams.get('productionStepId') ? Number(searchParams.get('productionStepId')) : undefined,
    };

    const validation = validateOutsourceOrderDetailExportParams(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid export parameters',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const params = validation.data;
    
    // Get all data for export
    const outsourceOrderDetails = await getOutsourceOrderDetailsByOwner({
      ...params,
      ownerId: userId,
      includeRelations: true,
    });

    if (outsourceOrderDetails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data found to export',
          code: 'NO_DATA',
        },
        { status: 404 }
      );
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = params.filename || `outsource-order-details-${timestamp}.${params.format}`;

    if (params.format === 'csv') {
      const csvContent = generateCSV(outsourceOrderDetails, params.includeHeaders);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // For Excel, we'll return JSON for now
      // In a real implementation, you'd use a library like exceljs
      return NextResponse.json({
        success: false,
        error: 'Excel export not implemented yet. Use CSV format.',
        code: 'NOT_IMPLEMENTED',
      }, { status: 501 });
    }
  } catch (error) {
    console.error('GET /api/outsourceOrderDetails/export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

function generateCSV(data: any[], includeHeaders: boolean): string {
  if (data.length === 0) return '';

  // Define headers
  const headers = [
    'ID',
    'Order Code',
    'Plan Code',
    'Plan Name', 
    'Product Code',
    'Product Name',
    'Step Code',
    'Step Name',
    'Ordered Quantity',
    'Completed Quantity',
    'Unit Price',
    'Total Price',
    'Expected Completion Date',
    'Actual Completion Date',
    'Status',
    'Sequence Number',
    'Notes',
    'Created At',
    'Updated At',
  ];

  // Convert data to CSV rows
  const rows = data.map(item => [
    item.id,
    item.outsourceOrder?.orderCode || '',
    item.planCode || '',
    item.planName || '',
    item.productCode || '',
    item.productName || '',
    item.stepCode || '',
    item.stepName || '',
    item.orderedQuantity || 0,
    item.completedQuantity || 0,
    item.unitPrice || '',
    item.totalPrice || '',
    item.expectedCompletionDate || '',
    item.actualCompletionDate || '',
    item.status || '',
    item.sequenceNumber || '',
    (item.itemNotes || '').replace(/"/g, '""'), // Escape quotes
    new Date(item.createdAt).toISOString(),
    new Date(item.updatedAt).toISOString(),
  ]);

  // Combine headers and rows
  const allRows = includeHeaders ? [headers, ...rows] : rows;

  // Convert to CSV string
  return allRows
    .map(row => 
      row.map(field => {
        const stringField = String(field);
        // Wrap in quotes if contains comma, quote, or newline
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    )
    .join('\n');
}
