import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createWorkTable, getWorkTablesByOwner } from '@/libs/queries/workTable';
import { validateCreateWorkTable, validateWorkTableListParams } from '@/libs/validations/workTable';
import type { WorkTableErrorResponse, WorkTableResponse, WorkTablesResponse } from '@/types/workTable';

// Helper function to convert Date to ISO string
function convertDateToISO(date: Date | string | null): string | null {
  if (!date) {
    return null;
  }
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString();
}

// Helper function for required date fields
function convertRequiredDateToISO(date: Date | string): string {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString();
}

export async function GET(request: NextRequest): Promise<NextResponse<WorkTablesResponse | WorkTableErrorResponse>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = validateWorkTableListParams(Object.fromEntries(searchParams));
    const params = { ...validatedParams, ownerId: userId };

    const workTables = await getWorkTablesByOwner(params);
    const total = workTables.length; // In a real app, you'd get total count separately

    return NextResponse.json({
      success: true,
      data: workTables.map(table => ({
        ...table,
        createdAt: convertRequiredDateToISO(table.createdAt),
        updatedAt: convertRequiredDateToISO(table.updatedAt),
        lastMaintenanceDate: convertDateToISO(table.lastMaintenanceDate),
        nextMaintenanceDate: convertDateToISO(table.nextMaintenanceDate),
        installationDate: convertDateToISO(table.installationDate),
        warrantyExpiryDate: convertDateToISO(table.warrantyExpiryDate),
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        hasMore: total > params.page * params.limit,
      },
    });
  } catch (error) {
    console.error('Error fetching work tables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work tables', code: 'FETCH_ERROR' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<WorkTableResponse | WorkTableErrorResponse>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = validateCreateWorkTable({ ...body, ownerId: userId });

    const workTable = await createWorkTable(validatedData as any);

    return NextResponse.json({
      success: true,
      data: {
        ...workTable,
        createdAt: convertRequiredDateToISO(workTable.createdAt),
        updatedAt: convertRequiredDateToISO(workTable.updatedAt),
        lastMaintenanceDate: convertDateToISO(workTable.lastMaintenanceDate),
        nextMaintenanceDate: convertDateToISO(workTable.nextMaintenanceDate),
        installationDate: convertDateToISO(workTable.installationDate),
        warrantyExpiryDate: convertDateToISO(workTable.warrantyExpiryDate),
      },
      message: 'Work table created successfully',
    });
  } catch (error) {
    console.error('Error creating work table:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create work table', code: 'CREATE_ERROR' },
      { status: 500 },
    );
  }
}
