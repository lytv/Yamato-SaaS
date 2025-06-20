import { auth } from '@clerk/nextjs/server';
import * as ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

import { getProductStepCrosstab } from '@/libs/queries/productStepCrosstab';
import { AppConfig } from '@/utils/AppConfig';

export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const ownerId = orgId || userId;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const productCode = searchParams.get('productCode') || undefined;
    const priceType
      = searchParams.get('priceType') === 'factory' ? 'factory' : 'calculated';

    // Fetch all data without pagination for export
    const data = await getProductStepCrosstab({
      ownerId,
      priceType,
      search,
      productCode,
      limit: 10000, // A large number to get all records
      page: 1,
    });

    // Create pivot data
    const allSteps = new Map<string, string>();
    data.forEach((product) => {
      product.steps.forEach((step) => {
        if (!allSteps.has(step.stepCode)) {
          allSteps.set(step.stepCode, step.stepName);
        }
      });
    });

    const pivotData = data.map((product) => {
      const row: any = {
        productCode: product.productCode,
        productName: product.productName,
      };
      product.steps.forEach((step) => {
        row[step.stepCode] = Number.parseFloat(step.price) || 0;
      });
      return row;
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Product Step Crosstab');

    const columns = [
      { header: 'Product Code', key: 'productCode', width: 20 },
      { header: 'Product Name', key: 'productName', width: 30 },
      ...Array.from(allSteps.entries()).map(([stepCode, stepName]) => ({
        header: `${stepCode} (${stepName})`,
        key: stepCode,
        width: 15,
        style: { numFmt: '#,##0.00' },
      })),
    ];

    worksheet.columns = columns;
    worksheet.addRows(pivotData);

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="product_step_crosstab_${AppConfig.defaultLocale}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exporting crosstab data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
