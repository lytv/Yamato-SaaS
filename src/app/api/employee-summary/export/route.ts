/**
 * Employee Summary Export API Route
 * Exports only employee summary data as Excel
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/libs/DB';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse parameters
    const userIds = searchParams.get('userIds')?.split(',').filter(Boolean) || null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search') || '';

    // Validate required dates
    if (!startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Start date and end date are required' 
      }, { status: 400 });
    }

    // Call the stored procedure
    const userIdsArray = userIds ? `{${userIds.join(',')}}` : null;
    
    const result = await db.execute(
      sql`SELECT * FROM calculate_user_salary_details(${userIdsArray}::TEXT[], ${startDate}::DATE, ${endDate}::DATE)`
    );

    let salaryDetails = result.rows.map((row: any) => ({
      user_id: row.user_id,
      full_name: row.full_name,
      work_date: row.work_date,
      source_table: row.source_table,
      product_code: row.product_code,
      product_name: row.product_name,
      step_code: row.step_code,
      step_name: row.step_name,
      quantity: parseInt(row.quantity),
      unit_price: parseFloat(row.unit_price),
      total_amount: parseFloat(row.line_total),
      created_at: row.created_at
    }));

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      salaryDetails = salaryDetails.filter((item: any) =>
        item.full_name.toLowerCase().includes(searchLower) ||
        item.product_code.toLowerCase().includes(searchLower) ||
        item.product_name.toLowerCase().includes(searchLower) ||
        item.step_code.toLowerCase().includes(searchLower) ||
        item.step_name.toLowerCase().includes(searchLower)
      );
    }

    // Calculate user summary
    const userSummary = salaryDetails.reduce((acc: any, item: any) => {
      if (!acc[item.user_id]) {
        acc[item.user_id] = {
          user_id: item.user_id,
          full_name: item.full_name,
          total_amount: 0,
        };
      }
      acc[item.user_id].total_amount += item.total_amount;
      return acc;
    }, {});

    // Transform user summary data for Excel export (without record count)
    const summaryExportData = Object.values(userSummary).map((user: any) => ({
      'Nhân viên': user.full_name,
      'Tổng tiền': user.total_amount,
    }));

    // Create workbook with employee summary only
    const workbook = XLSX.utils.book_new();
    
    // Employee summary sheet
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryExportData);
    const summaryColumnWidths = [
      { wch: 25 }, // Nhân viên
      { wch: 18 }, // Tổng tiền
    ];
    summaryWorksheet['!cols'] = summaryColumnWidths;
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Tổng hợp theo nhân viên');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `employee-summary-${timestamp}.xlsx`;

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
    console.error('Error exporting employee summary:', error);
    return NextResponse.json(
      { error: 'Failed to export employee summary' },
      { status: 500 }
    );
  }
}