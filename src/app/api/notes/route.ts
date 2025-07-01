/**
 * Note API Routes - Main endpoint
 * GET /api/notes - List notes with pagination and filtering
 * POST /api/notes - Create new note
 * Following Yamato-SaaS patterns with Clerk authentication
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { createNote, getPaginatedNotes } from '@/libs/queries/note';
import {
  validateCreateNote,
  validateNoteListParams,
} from '@/libs/validations/note';
import type {
  NoteErrorResponse,
  NoteResponse,
  NotesResponse,
} from '@/types/note';

/**
 * GET /api/notes - List notes with pagination and filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse<NotesResponse | NoteErrorResponse>> {
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
    // FIX: Parse and validate query parameters with proper null handling
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validatedParams = { ...validateNoteListParams(queryParams), ownerId };

    // Get paginated notes
    const result = await getPaginatedNotes(validatedParams);

    return NextResponse.json({
      success: true,
      data: result.notes,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching notes:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
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
 * POST /api/notes - Create new note
 */
export async function POST(request: NextRequest): Promise<NextResponse<NoteResponse | NoteErrorResponse>> {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateCreateNote(body);

    // Create note with owner information
    const note = await createNote({
      ...validatedData,
      ownerId,
    });

    return NextResponse.json(
      {
        success: true,
        data: note,
        message: 'Note created successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating note:', error);

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
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'CREATE_ERROR',
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
