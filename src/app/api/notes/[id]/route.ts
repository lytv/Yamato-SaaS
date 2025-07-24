/**
 * Note API Routes - Individual note operations
 * GET /api/notes/[id] - Get single note
 * PUT /api/notes/[id] - Update note
 * DELETE /api/notes/[id] - Delete note
 * Following Yamato-SaaS patterns with Clerk authentication
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { deleteNote, getNoteById, updateNote } from '@/libs/queries/note';
import {
  validateNoteId,
  validateUpdateNote,
} from '@/libs/validations/note';
import type {
  NoteErrorResponse,
  NoteResponse,
} from '@/types/note';

type RouteParams = {
  params: {
    id: string;
  };
};

/**
 * GET /api/notes/[id] - Get single note with ownership check
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<NoteResponse | NoteErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization notes, fallback to userId for personal notes
    const ownerId = orgId || userId;

    // Validate note ID
    const { id } = validateNoteId({ id: params.id });

    // Get note with ownership check
    const note = await getNoteById(id, ownerId);

    if (!note) {
      return NextResponse.json(
        {
          success: false,
          error: 'Note not found',
          code: 'NOT_FOUND',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error('Error fetching note:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid note ID',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'FETCH_ERROR',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/notes/[id] - Update note with ownership check
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<NoteResponse | NoteErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization notes, fallback to userId for personal notes
    const ownerId = orgId || userId;

    // Validate note ID
    const { id } = validateNoteId({ id: params.id });

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateUpdateNote(body);

    // Update note with ownership check
    const updatedNote = await updateNote(id, ownerId, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedNote,
      message: 'Note updated successfully',
    });
  } catch (error) {
    console.error('Error updating note:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      // Check for specific error messages
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Note not found or access denied',
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'UPDATE_ERROR',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/notes/[id] - Delete note with ownership check
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<{ success: true; message: string } | NoteErrorResponse>> {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 },
      );
    }

    // Use orgId for organization notes, fallback to userId for personal notes
    const ownerId = orgId || userId;

    // Validate note ID
    const { id } = validateNoteId({ id: params.id });

    // Delete note with ownership check
    await deleteNote(id, ownerId);

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting note:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid note ID',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      // Check for specific error messages
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Note not found or access denied',
            code: 'NOT_FOUND',
          },
          { status: 404 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'DELETE_ERROR',
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 },
    );
  }
}
