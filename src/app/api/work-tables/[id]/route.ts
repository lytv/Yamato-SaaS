import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { deleteWorkTable, getWorkTableById, updateWorkTable } from '@/libs/queries/workTable';
import { validateUpdateWorkTable, validateWorkTableId } from '@/libs/validations/workTable';
import type { WorkTableErrorResponse, WorkTableResponse } from '@/types/workTable';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<WorkTableResponse | WorkTableErrorResponse>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const { id } = validateWorkTableId({ id: params.id });
    const workTable = await getWorkTableById(id, userId);

    if (!workTable) {
      return NextResponse.json(
        { success: false, error: 'Work table not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

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
    });
  } catch (error) {
    console.error('Error fetching work table:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work table', code: 'FETCH_ERROR' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<WorkTableResponse | WorkTableErrorResponse>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const { id } = validateWorkTableId({ id: params.id });
    const body = await request.json();
    const validatedData = validateUpdateWorkTable(body);

    const patch = { ...validatedData };

    const workTable = await updateWorkTable(id, userId, patch as any);

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
      message: 'Work table updated successfully',
    });
  } catch (error) {
    console.error('Error updating work table:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message, code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update work table', code: 'UPDATE_ERROR' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<{ success: true; message: string } | WorkTableErrorResponse>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const { id } = validateWorkTableId({ id: params.id });
    const deleted = await deleteWorkTable(id, userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Work table not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Work table deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting work table:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete work table', code: 'DELETE_ERROR' },
      { status: 500 },
    );
  }
}
