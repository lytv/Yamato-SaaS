-- Create stored procedures for Todo CRUD operations
-- Version: 1.0.0
-- Date: 2024-12-08
-- Following TDD approach - making RED tests GREEN

-- 1. Get todo by ID with ownership check
CREATE OR REPLACE FUNCTION get_todo_by_id(p_todo_id INTEGER, p_owner_id TEXT)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get todos count with search
CREATE OR REPLACE FUNCTION get_todos_count(p_owner_id TEXT, p_search TEXT DEFAULT NULL)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get paginated todos
CREATE OR REPLACE FUNCTION get_paginated_todos(
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
  
  -- Get total count first
  SELECT get_todos_count(p_owner_id, p_search) INTO total_records;
  
  -- Return paginated results with total count
  RETURN QUERY
  EXECUTE format(
    'SELECT t.id, t.owner_id, t.title, t.message, t.created_at, t.updated_at, %L::BIGINT as total_count
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create todo
CREATE OR REPLACE FUNCTION create_todo(p_owner_id TEXT, p_title TEXT, p_message TEXT)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update todo with merge logic (CRITICAL: preserves existing values when NULL passed)
CREATE OR REPLACE FUNCTION update_todo(
  p_todo_id