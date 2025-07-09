/**
 * OutsourceOrderReceipt Export API Route
 * Generated based on existing pattern from outsourceOrderDetails/export/route.ts
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getOutsourceOrderReceiptsByOwner } from '@/libs/queries/outsourceOrderReceipt';
import { validateOutsourceOrderReceiptExportParams } from '@/libs/validations/outsourceOrderReceipt';

// GET /api/outsourceOrderReceipts/export
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // Use orgId for organization-based multi-tenancy, fallback to userId
    const ownerId = orgId || userId;

    const { searchParams } = new URL(request.url);
    const rawParams = {
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      outsourceOrderDetailId: searchParams.get('outsourceOrderDetailId') ? Number(searchParams.get('outsourceOrderDetailId')) : undefined,
      qualityStatus: searchParams.get('qualityStatus') || undefined,
      status: searchParams.get('status') || undefined,
      receivedByUserId: searchParams.get('receivedByUserId') || undefined,
      batchNumber: searchParams.get('batchNumber') || undefined,
      format: searchParams.get('format') || 'xlsx',
      includeHeaders: searchParams.get('includeHeaders') !== 'false',
      filename: searchParams.get('filename') || undefined,
      showAll: true, // Export all data by default
    };

    const validation = validateOutsourceOrderReceiptExportParams(rawParams);
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

    // Get all matching data for export
    const outsourceOrderReceipts = await getOutsourceOrderReceiptsByOwner({
      ...params,
      ownerId,
      includeRelations: true,
    });

    if (!outsourceOrderReceipts.length) {
      return NextResponse.json(
        { success: false, error: 'No data found for export', code: 'NO_DATA' },
        { status: 404 }
      );
    }

    // Prepare CSV data
    const csvHeaders = [
      'Receipt Number',
      'Receipt Title',
      'Receipt Date',
      'Detail Item',
      'Product Code',
      'Product Name',
      'Production Step',
      'Receipt Quantity',
      'Defect Quantity',
      'Rework Quantity',
      'Quality Status',
      'Quality Score',
      'Received By',
      'Batch Number',
      'Storage Location',
      'Warehouse Code',
      'Actual Unit Cost',
      'Total Cost',
      'Status',
      'Notes',
      'Created At',
    ];

    const csvRows = outsourceOrderReceipts.map(receipt => [
      receipt.receiptNumber || '',
      receipt.receiptTitle || '',
      receipt.receiptDate || '',
      `${receipt.outsourceOrderDetail?.planCode || ''} - ${receipt.outsourceOrderDetail?.productCode || ''} - ${receipt.outsourceOrderDetail?.stepCode || ''}`,
      receipt.outsourceOrderDetail?.productCode || '',
      receipt.outsourceOrderDetail?.productName || '',
      `${receipt.outsourceOrderDetail?.stepCode || ''} - ${receipt.outsourceOrderDetail?.stepName || ''}`,
      receipt.receiptQuantity?.toString() || '0',
      receipt.defectQuantity?.toString() || '0',
      receipt.reworkQuantity?.toString() || '0',
      receipt.qualityStatus || '',
      receipt.qualityScore?.toString() || '',
      receipt.receivedByUser?.fullName || '',
      receipt.batchNumber || '',
      receipt.storageLocation || '',
      receipt.warehouseCode || '',
      receipt.actualUnitCost || '',
      receipt.totalCost || '',
      receipt.status || '',
      receipt.notes || '',
      receipt.createdAt ? new Date(receipt.createdAt).toISOString().slice(0, 19).replace('T', ' ') : '',
    ]);

    // Generate CSV content
    const csvContent = [
      params.includeHeaders ? csvHeaders.join(',') : null,
      ...csvRows.map(row => 
        row.map(cell => {
          // Escape cells that contain commas, quotes, or newlines
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ),
    ].filter(Boolean).join('\n');

    // Set filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = params.filename || `outsource_order_receipts_${timestamp}.${params.format}`;

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('GET /api/outsourceOrderReceipts/export error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        return NextResponse.json(
          { success: false, error: error.message, code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
