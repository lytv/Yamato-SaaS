/**
 * Note database queries using Drizzle ORM
 * Following Yamato-SaaS patterns and TypeScript Type Safety Standards
 * Supporting multi-tenancy (personal vs organization notes)
 */

import { and, asc, count, desc, eq, gte, ilike, or } from 'drizzle-orm';

import { db } from '../db';
import { noteSchema } from '@/models/Schema';
import type {
  CreateNoteInput,
  NoteDb,
  NoteListParams,
  NoteStats,
  UpdateNoteInput,
} from '@/types/note';

/**
 * Create a new note
 * @param data - Note creation data
 * @returns Promise resolving to created note
 */
export async function createNote(data: CreateNoteInput): Promise<NoteDb> {
  const [note] = await db
    .insert(noteSchema)
    .values({
      ownerId: data.ownerId,
      title: data.title,
      content: data.content,
      category: data.category,
    })
    .returning();

  if (!note) {
    throw new Error('Failed to create note');
  }

  return note;
}

/**
 * Get notes by owner with pagination and filtering
 * @param params - Query parameters including ownerId, pagination, and filters
 * @returns Promise resolving to array of notes
 */
export async function getNotesByOwner(params: NoteListParams): Promise<NoteDb[]> {
  const { ownerId, page, limit, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  let whereConditions = eq(noteSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(noteSchema.ownerId, ownerId),
      or(
        ilike(noteSchema.title, searchTerm),
        ilike(noteSchema.content, searchTerm),
        ilike(noteSchema.category, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  // Build sort order
  const sortColumn = noteSchema[sortBy];
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

  return await db
    .select()
    .from(noteSchema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

/**
 * Get total count of notes for pagination
 * @param ownerId - Owner ID (userId or organizationId)
 * @param search - Optional search term
 * @returns Promise resolving to total count
 */
export async function getNotesCount(ownerId: string, search?: string): Promise<number> {
  // Build where conditions
  let whereConditions = eq(noteSchema.ownerId, ownerId);

  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(noteSchema.ownerId, ownerId),
      or(
        ilike(noteSchema.title, searchTerm),
        ilike(noteSchema.content, searchTerm),
        ilike(noteSchema.category, searchTerm),
      ),
    );
    if (searchCondition) {
      whereConditions = searchCondition;
    }
  }

  const [result] = await db
    .select({ count: count() })
    .from(noteSchema)
    .where(whereConditions);

  return result?.count ?? 0;
}

/**
 * Get a single note by ID with ownership check
 * @param id - Note ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to note or null if not found
 */
export async function getNoteById(id: number, ownerId: string): Promise<NoteDb | null> {
  const [note] = await db
    .select()
    .from(noteSchema)
    .where(
      and(
        eq(noteSchema.id, id),
        eq(noteSchema.ownerId, ownerId),
      ),
    )
    .limit(1);

  return note ?? null;
}

/**
 * Update a note with ownership check
 * @param id - Note ID
 * @param ownerId - Owner ID for authorization
 * @param data - Update data
 * @returns Promise resolving to updated note
 */
export async function updateNote(
  id: number,
  ownerId: string,
  data: UpdateNoteInput,
): Promise<NoteDb> {
  // First check if note exists and belongs to owner
  const existingNote = await getNoteById(id, ownerId);
  if (!existingNote) {
    throw new Error('Note not found or access denied');
  }

  const [updatedNote] = await db
    .update(noteSchema)
    .set({
      title: data.title ?? existingNote.title,
      content: data.content ?? existingNote.content,
      category: data.category ?? existingNote.category,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(noteSchema.id, id),
        eq(noteSchema.ownerId, ownerId),
      ),
    )
    .returning();

  if (!updatedNote) {
    throw new Error('Failed to update note');
  }

  return updatedNote;
}

/**
 * Delete a note with ownership check
 * @param id - Note ID
 * @param ownerId - Owner ID for authorization
 * @returns Promise resolving to success boolean
 */
export async function deleteNote(id: number, ownerId: string): Promise<boolean> {
  // First check if note exists and belongs to owner
  const existingNote = await getNoteById(id, ownerId);
  if (!existingNote) {
    throw new Error('Note not found or access denied');
  }

  await db
    .delete(noteSchema)
    .where(
      and(
        eq(noteSchema.id, id),
        eq(noteSchema.ownerId, ownerId),
      ),
    );

  return true;
}

/**
 * Get note statistics for dashboard
 * @param ownerId - Owner ID (userId or organizationId)
 * @returns Promise resolving to note statistics
 */
export async function getNoteStats(ownerId: string): Promise<NoteStats> {
  // Calculate date ranges
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(noteSchema)
    .where(eq(noteSchema.ownerId, ownerId));

  // Get today's count
  const [todayResult] = await db
    .select({ count: count() })
    .from(noteSchema)
    .where(
      and(
        eq(noteSchema.ownerId, ownerId),
        gte(noteSchema.createdAt, today),
      ),
    );

  // Get this week's count
  const [weekResult] = await db
    .select({ count: count() })
    .from(noteSchema)
    .where(
      and(
        eq(noteSchema.ownerId, ownerId),
        gte(noteSchema.createdAt, weekStart),
      ),
    );

  // Get this month's count
  const [monthResult] = await db
    .select({ count: count() })
    .from(noteSchema)
    .where(
      and(
        eq(noteSchema.ownerId, ownerId),
        gte(noteSchema.createdAt, monthStart),
      ),
    );

  return {
    total: totalResult?.count ?? 0,
    today: todayResult?.count ?? 0,
    thisWeek: weekResult?.count ?? 0,
    thisMonth: monthResult?.count ?? 0,
  };
}

/**
 * Check if a note exists and belongs to the specified owner
 * @param id - Note ID
 * @param ownerId - Owner ID
 * @returns Promise resolving to boolean
 */
export async function noteExists(id: number, ownerId: string): Promise<boolean> {
  const note = await getNoteById(id, ownerId);
  return note !== null;
}

/**
 * Get paginated notes with metadata
 * This is a convenience function that combines getNotesByOwner and getNotesCount
 * @param params - Query parameters
 * @returns Promise resolving to notes with pagination metadata
 */
export async function getPaginatedNotes(params: NoteListParams): Promise<{
  notes: NoteDb[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}> {
  const [notes, total] = await Promise.all([
    getNotesByOwner(params),
    getNotesCount(params.ownerId, params.search),
  ]);

  const hasMore = params.page * params.limit < total;

  return {
    notes,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      hasMore,
    },
  };
}
