/**
 * Apply Stored Procedures Migration
 * Following TDD approach - GREEN phase implementation
 */

import { sql } from 'drizzle-orm';

import { db } from '../src/libs/DB';

async function applyStoredProcedures(): Promise<void> {
  try {
    console.log('🚀 Applying stored procedures migration...');

    // Migration approach: Execute procedures individually for better error handling

    // Execute each stored procedure creation individually
    const procedures = [
      // 1. Get todo by ID
      `CREATE OR REPLACE FUNCTION get_todo_by_id(p_todo_id INTEGER, p_owner_id TEXT)
RETURNS TABLE(
  id INTEGER,
  owner_id TEXT,
  title TEXT,
  message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.owner_id, t.title, t.message, t.created_at, t.updated_at
  FROM todo t
  WHERE t.id = p_todo_id AND t.owner_id = p_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`,

      // 2. Get todos count
      `CREATE OR REPLACE FUNCTION get_todos_count(p_owner_id TEXT, p_search TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  result_count INTEGER;
BEGIN
  IF p_search IS NULL OR p_search = '' THEN
    SELECT COUNT(*) INTO result_count
    FROM todo t
    WHERE t.owner_id = p_owner_id;
  ELSE
    SELECT COUNT(*) INTO result_count
    FROM todo t
    WHERE t.owner_id = p_owner_id
    AND (t.title ILIKE '%' || p_search || '%' OR t.message ILIKE '%' || p_search || '%');
  END IF;
  
  RETURN COALESCE(result_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`,

      // 3. Get paginated todos
      `CREATE OR REPLACE FUNCTION get_paginated_todos(
  p_owner_id TEXT, 
  p_page INTEGER, 
  p_limit INTEGER, 
  p_search TEXT, 
  p_sort_by TEXT, 
  p_sort_order TEXT
)
RETURNS TABLE(
  id INTEGER,
  owner_id TEXT,
  title TEXT,
  message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  total_count BIGINT
) AS $$
DECLARE
  offset_val INTEGER;
  sort_column TEXT;
  order_direction TEXT;
  total_records BIGINT;
BEGIN
  offset_val := (p_page - 1) * p_limit;
  sort_column := COALESCE(p_sort_by, 'created_at');
  order_direction := COALESCE(p_sort_order, 'desc');
  
  SELECT get_todos_count(p_owner_id, p_search) INTO total_records;
  
  RETURN QUERY
  EXECUTE format('
    SELECT t.id, t.owner_id, t.title, t.message, t.created_at, t.updated_at, %L::BIGINT as total_count
    FROM todo t
    WHERE t.owner_id = %L
    %s
    ORDER BY %I %s
    LIMIT %L OFFSET %L',
    total_records,
    p_owner_id,
    CASE 
      WHEN p_search IS NOT NULL AND p_search != '' THEN
        format('AND (t.title ILIKE %L OR t.message ILIKE %L)', 
               '%' || p_search || '%', '%' || p_search || '%')
      ELSE ''
    END,
    sort_column,
    order_direction,
    p_limit,
    offset_val
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`,

      // 4. Create todo
      `CREATE OR REPLACE FUNCTION create_todo(p_owner_id TEXT, p_title TEXT, p_message TEXT)
RETURNS TABLE(
  id INTEGER,
  owner_id TEXT,
  title TEXT,
  message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
DECLARE
  new_todo_id INTEGER;
BEGIN
  INSERT INTO todo (owner_id, title, message)
  VALUES (p_owner_id, p_title, p_message)
  RETURNING todo.id INTO new_todo_id;
  
  IF new_todo_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create todo';
  END IF;
  
  RETURN QUERY
  SELECT t.id, t.owner_id, t.title, t.message, t.created_at, t.updated_at
  FROM todo t
  WHERE t.id = new_todo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`,

      // 5. Update todo with merge logic
      `CREATE OR REPLACE FUNCTION update_todo(
  p_todo_id INTEGER, 
  p_owner_id TEXT, 
  p_title TEXT, 
  p_message TEXT
)
RETURNS TABLE(
  id INTEGER,
  owner_id TEXT,
  title TEXT,
  message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
DECLARE
  existing_todo RECORD;
  final_title TEXT;
  final_message TEXT;
BEGIN
  SELECT t.title, t.message INTO existing_todo
  FROM todo t
  WHERE t.id = p_todo_id AND t.owner_id = p_owner_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Todo not found or access denied';
  END IF;
  
  final_title := COALESCE(p_title, existing_todo.title);
  final_message := COALESCE(p_message, existing_todo.message);
  
  UPDATE todo 
  SET 
    title = final_title,
    message = final_message,
    updated_at = NOW()
  WHERE todo.id = p_todo_id AND todo.owner_id = p_owner_id;
  
  RETURN QUERY
  SELECT t.id, t.owner_id, t.title, t.message, t.created_at, t.updated_at
  FROM todo t
  WHERE t.id = p_todo_id AND t.owner_id = p_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`,

      // 6. Delete todo
      `CREATE OR REPLACE FUNCTION delete_todo(p_todo_id INTEGER, p_owner_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM todo WHERE id = p_todo_id AND owner_id = p_owner_id) THEN
    RAISE EXCEPTION 'Todo not found or access denied';
  END IF;
  
  DELETE FROM todo 
  WHERE id = p_todo_id AND owner_id = p_owner_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`,

      // 7. Get todo stats
      `CREATE OR REPLACE FUNCTION get_todo_stats(p_owner_id TEXT)
RETURNS TABLE(
  total INTEGER,
  today INTEGER,
  this_week INTEGER,
  this_month INTEGER
) AS $$
DECLARE
  today_start TIMESTAMP;
  week_start TIMESTAMP;
  month_start TIMESTAMP;
BEGIN
  today_start := DATE_TRUNC('day', NOW());
  week_start := DATE_TRUNC('week', NOW());
  month_start := DATE_TRUNC('month', NOW());
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM todo WHERE owner_id = p_owner_id) as total,
    (SELECT COUNT(*)::INTEGER FROM todo WHERE owner_id = p_owner_id AND created_at >= today_start) as today,
    (SELECT COUNT(*)::INTEGER FROM todo WHERE owner_id = p_owner_id AND created_at >= week_start) as this_week,
    (SELECT COUNT(*)::INTEGER FROM todo WHERE owner_id = p_owner_id AND created_at >= month_start) as this_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`,

      // 8. Todo exists
      `CREATE OR REPLACE FUNCTION todo_exists(p_todo_id INTEGER, p_owner_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM todo 
    WHERE id = p_todo_id AND owner_id = p_owner_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER`,
    ];

    // Execute each procedure
    for (let i = 0; i < procedures.length; i++) {
      console.log(`Creating stored procedure ${i + 1}/8...`);
      await db.execute(sql.raw(procedures[i] as string));
    }

    // Create indexes
    console.log('Creating performance indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_todo_owner_id ON todo(owner_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_todo_created_at ON todo(created_at)`);

    console.log('✅ Stored procedures migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
applyStoredProcedures().then(() => {
  console.log('Migration script completed');
  process.exit(0);
});
