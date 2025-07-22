/**
 * Salary Details Export API Route
 * Following Yamato-SaaS patterns and Excel export standards
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

    // Parse parameters (same as main API)
    const userIds = searchParams.get('userIds')?.split(',').filter(Boolean) || null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'work_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate required dates
    if (!startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Start date and end date are required' 
      }, { status: 400 });
    }

    // Call the stored procedure (same as main API)
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

    // Apply search filter (same as main API)
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

    // Apply sorting (same as main API)
    salaryDetails.sort((a: any, b: any) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'work_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Calculate user summary (same as main API)
    const userSummary = salaryDetails.reduce((acc: any, item: any) => {
      if (!acc[item.user_id]) {
        acc[item.user_id] = {
          user_id: item.user_id,
          full_name: item.full_name,
          total_amount: 0,
          record_count: 0
        };
      }
      acc[item.user_id].total_amount += item.total_amount;
      acc[item.user_id].record_count += 1;
      return acc;
    }, {});

    // Transform data for Excel export - Main salary details
    const mainExportData = salaryDetails.map((detail: any) => ({
      'Ngày làm việc': new Date(detail.work_date).toLocaleDateString('vi-VN'),
      'Nhân viên': detail.full_name,
      'Nguồn': detail.source_table === 'employee_salary' ? 'Lương NV' : 'Gia công',
      'Mã sản phẩm': detail.product_code,
      'Tên sản phẩm': detail.product_name,
      'Mã công đoạn': detail.step_code,
      'Tên công đoạn': detail.step_name,
      'Số lượng': detail.quantity,
      'Đơn giá': detail.unit_price,
      'Thành tiền': detail.total_amount,
    }));

    // Transform user summary data for Excel export
    const summaryExportData = Object.values(userSummary).map((user: any) => ({
      'Nhân viên': user.full_name,
      'Số bản ghi': user.record_count,
      'Tổng tiền': user.total_amount,
    }));

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Main salary details
    const mainWorksheet = XLSX.utils.json_to_sheet(mainExportData);
    const mainColumnWidths = [
      { wch: 12 }, // Ngày làm việc
      { wch: 20 }, // Nhân viên
      { wch: 10 }, // Nguồn
      { wch: 15 }, // Mã sản phẩm
      { wch: 25 }, // Tên sản phẩm
      { wch: 15 }, // Mã công đoạn
      { wch: 25 }, // Tên công đoạn
      { wch: 10 }, // Số lượng
      { wch: 15 }, // Đơn giá
      { wch: 15 }, // Thành tiền
      { wch: 18 }, // Ngày tạo
    ];
    mainWorksheet['!cols'] = mainColumnWidths;
    XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'Chi tiết lương');

    // Sheet 2: Employee summary
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryExportData);
    const summaryColumnWidths = [
      { wch: 20 }, // Nhân viên
      { wch: 12 }, // Số bản ghi
      { wch: 15 }, // Tổng tiền
    ];
    summaryWorksheet['!cols'] = summaryColumnWidths;
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Tổng hợp theo nhân viên');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `salary-details-${timestamp}.xlsx`;

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
    console.error('Error exporting salary details:', error);
    return NextResponse.json(
      { error: 'Failed to export salary details' },
      { status: 500 }
    );
  }
}