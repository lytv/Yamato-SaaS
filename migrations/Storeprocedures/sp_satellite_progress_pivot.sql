-- =============================================
-- Store Procedure: Satellite Progress Pivot Report (Tiến độ Vệ tinh)
-- Description: Dynamic pivot table showing outsource progress by satellite staff
-- Input: Product Code, Plan Code, Assigned User ID
-- Output: Product | Plan | Planned Qty | All Dynamic Steps | Total
-- File: sp_satellite_progress_pivot.sql
-- =============================================

-- Drop existing function first
DROP FUNCTION IF EXISTS sp_satellite_progress_pivot(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION sp_satellite_progress_pivot(
    filter_product_code TEXT DEFAULT NULL,
    filter_plan_code TEXT DEFAULT NULL,
    filter_assigned_user_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    product_code TEXT,
    product_name TEXT,
    plan_code TEXT,
    plan_name TEXT,
    assigned_user_name TEXT,
    planned_quantity INTEGER,
    step_data JSONB,
    total_completed INTEGER,
    completion_rate NUMERIC
) AS $$
BEGIN
    -- Satellite Progress Pivot Report using JSON for flexibility
    RETURN QUERY
    WITH base_data AS (
        -- Get all outsource order details with assigned users
        SELECT DISTINCT
            prod.product_code AS base_product_code,
            prod.product_name AS base_product_name,
            plan_tbl.plan_code AS base_plan_code,
            plan_tbl.plan_name AS base_plan_name,
            COALESCE(us.full_name, oo.assigned_to_user_id) AS base_assigned_user_name,
            oo.assigned_to_user_id AS base_assigned_user_id,
            COALESCE(SUM(ood.ordered_quantity), 0)::INTEGER AS base_planned_quantity
        FROM outsource_order oo
        INNER JOIN outsource_order_detail ood ON oo.id = ood.outsource_order_id
        INNER JOIN plan plan_tbl ON ood.plan_id = plan_tbl.id
        INNER JOIN product prod ON ood.product_id = prod.id
        INNER JOIN production_step ps ON ood.production_step_id = ps.id
        LEFT JOIN user_sync us ON oo.assigned_to_user_id = us.user_id
        WHERE 
            (filter_product_code IS NULL OR prod.product_code = filter_product_code)
            AND (filter_plan_code IS NULL OR plan_tbl.plan_code = filter_plan_code)
            AND (filter_assigned_user_id IS NULL OR oo.assigned_to_user_id = filter_assigned_user_id)
            AND ood.ordered_quantity > 0
        GROUP BY 
            prod.product_code, prod.product_name, 
            plan_tbl.plan_code, plan_tbl.plan_name,
            oo.assigned_to_user_id, us.full_name
    ),
    step_quantities AS (
        -- Get outsource receipt quantities by step
        SELECT 
            prod.product_code AS step_product_code,
            plan_tbl.plan_code AS step_plan_code,
            oo.assigned_to_user_id AS step_assigned_user_id,
            ps.step_code AS step_code_name,
            ps.step_name AS step_name_display,
            COALESCE(SUM(oor.receipt_quantity), 0)::INTEGER AS receipt_quantity
        FROM outsource_order oo
        INNER JOIN outsource_order_detail ood ON oo.id = ood.outsource_order_id
        INNER JOIN plan plan_tbl ON ood.plan_id = plan_tbl.id
        INNER JOIN product prod ON ood.product_id = prod.id
        INNER JOIN production_step ps ON ood.production_step_id = ps.id
        LEFT JOIN outsource_order_receipt oor ON ood.id = oor.outsource_order_detail_id
        WHERE 
            (filter_product_code IS NULL OR prod.product_code = filter_product_code)
            AND (filter_plan_code IS NULL OR plan_tbl.plan_code = filter_plan_code)
            AND (filter_assigned_user_id IS NULL OR oo.assigned_to_user_id = filter_assigned_user_id)
        GROUP BY prod.product_code, plan_tbl.plan_code, oo.assigned_to_user_id, ps.step_code, ps.step_name
        HAVING SUM(oor.receipt_quantity) > 0
    ),
    final_aggregation AS (
        -- Create JSON object for each product-plan-user combination
        SELECT 
            bd.base_product_code,
            bd.base_product_name,
            bd.base_plan_code,
            bd.base_plan_name,
            bd.base_assigned_user_name,
            bd.base_planned_quantity,
            COALESCE(
                jsonb_object_agg(
                    sq.step_code_name, 
                    jsonb_build_object(
                        'step_code', sq.step_code_name,
                        'step_name', sq.step_name_display,
                        'quantity', sq.receipt_quantity
                    )
                ) FILTER (WHERE sq.step_code_name IS NOT NULL),
                '{}'::jsonb
            ) AS json_step_data,
            COALESCE(SUM(sq.receipt_quantity), 0)::INTEGER AS total_quantity_completed
        FROM base_data bd
        LEFT JOIN step_quantities sq ON bd.base_product_code = sq.step_product_code 
            AND bd.base_plan_code = sq.step_plan_code
            AND bd.base_assigned_user_id = sq.step_assigned_user_id
        GROUP BY 
            bd.base_product_code, bd.base_product_name, 
            bd.base_plan_code, bd.base_plan_name,
            bd.base_assigned_user_name, bd.base_planned_quantity
    )
    SELECT 
        fa.base_product_code::TEXT as product_code,
        fa.base_product_name::TEXT as product_name,
        fa.base_plan_code::TEXT as plan_code,
        fa.base_plan_name::TEXT as plan_name,
        fa.base_assigned_user_name::TEXT as assigned_user_name,
        fa.base_planned_quantity as planned_quantity,
        fa.json_step_data as step_data,
        fa.total_quantity_completed as total_completed,
        CASE 
            WHEN fa.base_planned_quantity > 0 
            THEN ROUND((fa.total_quantity_completed::NUMERIC / fa.base_planned_quantity) * 100, 2)
            ELSE 0 
        END as completion_rate
    FROM final_aggregation fa
    ORDER BY fa.base_product_code, fa.base_plan_code, fa.base_assigned_user_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Helper Function: Get Satellite Users Filter Options
-- =============================================

DROP FUNCTION IF EXISTS sp_satellite_progress_filter_users();

CREATE OR REPLACE FUNCTION sp_satellite_progress_filter_users()
RETURNS TABLE (
    user_id TEXT,
    user_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        oo.assigned_to_user_id::TEXT,
        COALESCE(us.full_name, oo.assigned_to_user_id)::TEXT as user_name
    FROM outsource_order oo
    LEFT JOIN user_sync us ON oo.assigned_to_user_id = us.user_id
    WHERE oo.assigned_to_user_id IS NOT NULL
    ORDER BY user_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Test SQL Commands
-- =============================================

-- Test 1: Get all satellite progress data
-- SELECT * FROM sp_satellite_progress_pivot(NULL, NULL, NULL) LIMIT 5;

-- Test 2: Get specific user data (replace 'USER_ID' with actual user ID)
-- SELECT * FROM sp_satellite_progress_pivot(NULL, NULL, 'USER_ID') LIMIT 5;

-- Test 3: Get available users for filter
-- SELECT * FROM sp_satellite_progress_filter_users() LIMIT 10;

-- Test 4: Check JSON structure
-- SELECT 
--     product_code, 
--     plan_code, 
--     assigned_user_name,
--     planned_quantity,
--     total_completed,
--     completion_rate,
--     jsonb_pretty(step_data) as formatted_step_data
-- FROM sp_satellite_progress_pivot(NULL, NULL, NULL) 
-- WHERE step_data != '{}'::jsonb 
-- LIMIT 3;

-- =============================================
-- Usage Examples:
-- =============================================
-- 1. Get all satellite progress:
-- SELECT * FROM sp_satellite_progress_pivot(NULL, NULL, NULL);
-- 
-- 2. Get specific product progress:
-- SELECT * FROM sp_satellite_progress_pivot('NHA01', NULL, NULL);
--
-- 3. Get specific user progress:
-- SELECT * FROM sp_satellite_progress_pivot(NULL, NULL, 'user_2abc123def');
--
-- 4. Get users for dropdown:
-- SELECT * FROM sp_satellite_progress_filter_users();
--
-- =============================================
-- Migration Notes:
-- This procedure focuses only on outsource_order_detail and outsource_order_receipt
-- Includes assigned_to_user_id for filtering by satellite staff
-- Uses JSONB for dynamic step columns supporting 100+ production steps
-- =============================================