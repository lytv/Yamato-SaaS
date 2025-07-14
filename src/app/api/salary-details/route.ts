import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/libs/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userIds = url.searchParams.get('userIds')?.split(',').filter(Boolean) || null;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'work_date';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const showAll = url.searchParams.get('showAll') === 'true';

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
      line_total: parseFloat(row.line_total)
    }));

    // Apply search filter
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

    // Apply sorting
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

    // Calculate totals and statistics
    const totalRecords = salaryDetails.length;
    const totalAmount = salaryDetails.reduce((sum: number, item: any) => sum + item.line_total, 0);
    
    const userSummary = salaryDetails.reduce((acc: any, item: any) => {
      if (!acc[item.user_id]) {
        acc[item.user_id] = {
          user_id: item.user_id,
          full_name: item.full_name,
          total_amount: 0,
          record_count: 0
        };
      }
      acc[item.user_id].total_amount += item.line_total;
      acc[item.user_id].record_count += 1;
      return acc;
    }, {});

    // Apply pagination if not showing all
    let paginatedData = salaryDetails;
    let pagination = null;
    
    if (!showAll) {
      const offset = (page - 1) * limit;
      paginatedData = salaryDetails.slice(offset, offset + limit);
      
      pagination = {
        page,
        limit,
        total: totalRecords,
        hasMore: offset + limit < totalRecords,
        totalPages: Math.ceil(totalRecords / limit)
      };
    }

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination,
      summary: {
        total_records: totalRecords,
        total_amount: totalAmount,
        user_summary: Object.values(userSummary),
        date_range: { start_date: startDate, end_date: endDate }
      }
    });

  } catch (error) {
    console.error('Error fetching salary details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}