-- =============================================
-- Store Procedure: Dynamic Production Progress Pivot Report (FIXED VERSION)
-- Description: Dynamic pivot table showing ALL production steps
-- Input: Product Code, Plan Code
-- Output: Product | Plan | Planned Qty | All Dynamic Steps | Total
-- File: sp_production_progress_pivot_dynamic_fixed.sql
-- =============================================

-- Drop existing function first
DROP FUNCTION IF EXISTS sp_production_progress_pivot_dynamic(TEXT, TEXT);

CREATE OR REPLACE FUNCTION sp_production_progress_pivot_dynamic(
    filter_product_code TEXT DEFAULT NULL,
    filter_plan_code TEXT DEFAULT NULL
)
RETURNS TABLE (
    product_code TEXT,
    product_name TEXT,
    plan_code TEXT,
    plan_name TEXT,
    planned_quantity INTEGER,
    step_data JSONB,
    total_completed INTEGER,
    completion_rate NUMERIC
) AS $$
BEGIN
    -- Dynamic Production Progress Pivot Report using JSON for flexibility
    RETURN QUERY
    WITH base_data AS (
        -- Get all plan-product combinations with planned quantities
        SELECT 
            prod.product_code AS base_product_code,
            prod.product_name AS base_product_name,
            plan_tbl.plan_code AS base_plan_code,
            plan_tbl.plan_name AS base_plan_name,
            COALESCE(pd.planned_quantity, 0)::INTEGER AS base_planned_quantity
        FROM plan plan_tbl
        INNER JOIN plan_detail pd ON plan_tbl.id = pd.plan_id
        INNER JOIN product prod ON pd.product_code = prod.product_code
        WHERE 
            (filter_product_code IS NULL OR prod.product_code = filter_product_code)
            AND (filter_plan_code IS NULL OR plan_tbl.plan_code = filter_plan_code)
            AND pd.planned_quantity > 0
    ),
    step_quantities AS (
        -- Get employee salary quantities
        SELECT 
            prod.product_code AS step_product_code,
            plan_tbl.plan_code AS step_plan_code,
            ps.step_code AS step_code_name,
            ps.step_name AS step_name_display,
            COALESCE(SUM(es.actual_quantity), 0)::INTEGER AS employee_quantity
        FROM plan plan_tbl
        INNER JOIN plan_detail pd ON plan_tbl.id = pd.plan_id
        INNER JOIN product prod ON pd.product_code = prod.product_code
        INNER JOIN production_step_detail psd ON prod.id = psd.product_id
        INNER JOIN production_step ps ON psd.production_step_id = ps.id
        LEFT JOIN employee_salary_entry es ON plan_tbl.id = es.plan_id 
            AND prod.id = es.product_id 
            AND psd.id = es.production_step_detail_id
        WHERE 
            (filter_product_code IS NULL OR prod.product_code = filter_product_code)
            AND (filter_plan_code IS NULL OR plan_tbl.plan_code = filter_plan_code)
        GROUP BY prod.product_code, plan_tbl.plan_code, ps.step_code, ps.step_name
        
        UNION ALL
        
        -- Get outsource receipt quantities
        SELECT 
            prod.product_code AS step_product_code,
            plan_tbl.plan_code AS step_plan_code,
            ps.step_code AS step_code_name,
            ps.step_name AS step_name_display,
            COALESCE(SUM(oor.receipt_quantity), 0)::INTEGER AS employee_quantity
        FROM plan plan_tbl
        INNER JOIN plan_detail pd ON plan_tbl.id = pd.plan_id
        INNER JOIN product prod ON pd.product_code = prod.product_code
        INNER JOIN outsource_order_detail ood ON plan_tbl.id = ood.plan_id 
            AND prod.id = ood.product_id
        INNER JOIN production_step ps ON ood.production_step_id = ps.id
        LEFT JOIN outsource_order_receipt oor ON ood.id = oor.outsource_order_detail_id
        WHERE 
            (filter_product_code IS NULL OR prod.product_code = filter_product_code)
            AND (filter_plan_code IS NULL OR plan_tbl.plan_code = filter_plan_code)
        GROUP BY prod.product_code, plan_tbl.plan_code, ps.step_code, ps.step_name
    ),
    aggregated_steps AS (
        -- Aggregate all step quantities by product and plan
        SELECT 
            step_product_code,
            step_plan_code,
            step_code_name,
            step_name_display,
            SUM(employee_quantity)::INTEGER AS total_step_quantity
        FROM step_quantities
        GROUP BY step_product_code, step_plan_code, step_code_name, step_name_display
        HAVING SUM(employee_quantity) > 0
    ),
    final_aggregation AS (
        -- Create JSON object for each product-plan combination
        SELECT 
            bd.base_product_code,
            bd.base_product_name,
            bd.base_plan_code,
            bd.base_plan_name,
            bd.base_planned_quantity,
            COALESCE(
                jsonb_object_agg(
                    ast.step_code_name, 
                    jsonb_build_object(
                        'step_code', ast.step_code_name,
                        'step_name', ast.step_name_display,
                        'quantity', ast.total_step_quantity
                    )
                ) FILTER (WHERE ast.step_code_name IS NOT NULL),
                '{}'::jsonb
            ) AS json_step_data,
            COALESCE(SUM(ast.total_step_quantity), 0)::INTEGER AS total_quantity_completed
        FROM base_data bd
        LEFT JOIN aggregated_steps ast ON bd.base_product_code = ast.step_product_code 
            AND bd.base_plan_code = ast.step_plan_code
        GROUP BY bd.base_product_code, bd.base_product_name, bd.base_plan_code, bd.base_plan_name, bd.base_planned_quantity
    )
    SELECT 
        fa.base_product_code::TEXT as product_code,
        fa.base_product_name::TEXT as product_name,
        fa.base_plan_code::TEXT as plan_code,
        fa.base_plan_name::TEXT as plan_name,
        fa.base_planned_quantity as planned_quantity,
        fa.json_step_data as step_data,
        fa.total_quantity_completed as total_completed,
        CASE 
            WHEN fa.base_planned_quantity > 0 
            THEN ROUND((fa.total_quantity_completed::NUMERIC / fa.base_planned_quantity) * 100, 2)
            ELSE 0 
        END as completion_rate
    FROM final_aggregation fa
    ORDER BY fa.base_product_code, fa.base_plan_code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Helper Function: Get Dynamic Column Structure
-- =============================================

DROP FUNCTION IF EXISTS sp_production_progress_pivot_columns(TEXT, TEXT);

CREATE OR REPLACE FUNCTION sp_production_progress_pivot_columns(
    filter_product_code TEXT DEFAULT NULL,
    filter_plan_code TEXT DEFAULT NULL
)
RETURNS TABLE (
    step_code TEXT,
    step_name TEXT,
    step_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        ps.step_code::TEXT,
        ps.step_name::TEXT,
        ROW_NUMBER() OVER (ORDER BY ps.step_code)::INTEGER as step_order
    FROM production_step ps
    WHERE EXISTS (
        SELECT 1
        FROM plan plan_tbl
        INNER JOIN plan_detail pd ON plan_tbl.id = pd.plan_id
        INNER JOIN product prod ON pd.product_code = prod.product_code
        INNER JOIN production_step_detail psd ON prod.id = psd.product_id AND ps.id = psd.production_step_id
        WHERE 
            (filter_product_code IS NULL OR prod.product_code = filter_product_code)
            AND (filter_plan_code IS NULL OR plan_tbl.plan_code = filter_plan_code)
    )
    ORDER BY ps.step_code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Test SQL Commands
-- =============================================

-- Test 1: Get all data (should work)
-- SELECT * FROM sp_production_progress_pivot_dynamic(NULL, NULL) LIMIT 5;

-- Test 2: Get specific product (replace 'YOUR_PRODUCT_CODE' with actual product code)
-- SELECT * FROM sp_production_progress_pivot_dynamic('YOUR_PRODUCT_CODE', NULL) LIMIT 5;

-- Test 3: Get column structure
-- SELECT * FROM sp_production_progress_pivot_columns(NULL, NULL) LIMIT 10;

-- Test 4: Check if step_data JSON is properly formatted
-- SELECT product_code, plan_code, step_data, jsonb_pretty(step_data) as formatted_json 
-- FROM sp_production_progress_pivot_dynamic(NULL, NULL) 
-- WHERE step_data != '{}'::jsonb LIMIT 3;

-- =============================================
-- Usage Examples:
-- =============================================
-- 1. Get dynamic pivot data:
-- SELECT * FROM sp_production_progress_pivot_dynamic('NHA01', '72025');
-- 
-- 2. Get column structure:
-- SELECT * FROM sp_production_progress_pivot_columns();
--
-- 3. Parse step data in application:
-- The step_data column contains JSON like:
-- {
--   "SONG": {"step_code": "SONG", "step_name": "Công đoạn Sóng", "quantity": 80},
--   "SUON": {"step_code": "SUON", "step_name": "Công đoạn Sưởn", "quantity": 70}
-- }
--
-- =============================================
-- Migration Notes:
-- This approach uses JSONB for dynamic columns which is more flexible
-- than hard-coding column limits. Supports 100+ production steps.
-- The frontend will need to parse the JSON step_data to create dynamic table columns.
-- 
-- To deploy: Run this SQL file against your database
-- =============================================