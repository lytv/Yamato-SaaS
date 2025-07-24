-- =============================================
-- Store Procedure: Dynamic Production Progress Pivot Report
-- Description: Dynamic pivot table showing ALL production steps
-- Input: Product Code, Plan Code
-- Output: Product | Plan | Planned Qty | All Dynamic Steps | Total
-- File: sp_production_progress_pivot_dynamic.sql
-- =============================================

CREATE OR REPLACE FUNCTION sp_production_progress_pivot_dynamic(
    input_product_code TEXT DEFAULT NULL,
    input_plan_code TEXT DEFAULT NULL
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
    WITH production_data AS (
        -- Get planned quantities and actual work for all steps
        SELECT 
            pr.product_code as prod_code,
            pr.product_name as prod_name,
            p.plan_code as plan_code_val,
            p.plan_name as plan_name_val,
            MAX(COALESCE(pd.planned_quantity, 0))::INTEGER as planned_qty,
            ps.step_code as step_code_val,
            ps.step_name as step_name_val,
            COALESCE(SUM(es.actual_quantity), 0)::INTEGER + COALESCE(SUM(oor.receipt_quantity), 0)::INTEGER as step_qty
        FROM plan p
        INNER JOIN plan_detail pd ON p.id = pd.plan_id
        INNER JOIN product pr ON pd.product_code = pr.product_code
        INNER JOIN production_step ps ON 1=1 -- Get all steps
        LEFT JOIN production_step_detail psd ON pr.id = psd.product_id AND ps.id = psd.production_step_id
        LEFT JOIN employee_salary_entry es ON p.id = es.plan_id 
            AND pr.id = es.product_id 
            AND psd.id = es.production_step_detail_id
        LEFT JOIN outsource_order_detail ood ON p.id = ood.plan_id 
            AND pr.id = ood.product_id 
            AND ps.id = ood.production_step_id
        LEFT JOIN outsource_order_receipt oor ON ood.id = oor.outsource_order_detail_id
        WHERE 
            (pr.product_code = input_product_code OR input_product_code IS NULL)
            AND (p.plan_code = input_plan_code OR input_plan_code IS NULL)
        GROUP BY pr.product_code, pr.product_name, p.plan_code, p.plan_name, ps.step_code, ps.step_name
        HAVING MAX(COALESCE(pd.planned_quantity, 0)) > 0 -- Only include products with planned quantity
    ),
    aggregated_data AS (
        SELECT 
            prod_code,
            prod_name,
            plan_code_val,
            plan_name_val,
            planned_qty,
            jsonb_object_agg(
                step_code_val, 
                jsonb_build_object(
                    'step_code', step_code_val,
                    'step_name', step_name_val,
                    'quantity', step_qty
                )
            ) FILTER (WHERE step_qty > 0) as step_data,
            SUM(step_qty)::INTEGER as total_completed
        FROM production_data
        GROUP BY prod_code, prod_name, plan_code_val, plan_name_val, planned_qty
    )
    SELECT 
        prod_code as product_code,
        prod_name as product_name,
        plan_code_val as plan_code,
        plan_name_val as plan_name,
        planned_qty as planned_quantity,
        COALESCE(step_data, '{}'::jsonb) as step_data,
        COALESCE(total_completed, 0) as total_completed,
        CASE 
            WHEN planned_qty > 0 
            THEN ROUND((COALESCE(total_completed, 0)::NUMERIC / planned_qty) * 100, 2)
            ELSE 0 
        END as completion_rate
    FROM aggregated_data
    ORDER BY prod_code, plan_code_val;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Alternative Function: Get Dynamic Column Structure
-- This helps the frontend know what columns to expect
-- =============================================

CREATE OR REPLACE FUNCTION sp_production_progress_pivot_columns(
    input_product_code TEXT DEFAULT NULL,
    input_plan_code TEXT DEFAULT NULL
)
RETURNS TABLE (
    step_code TEXT,
    step_name TEXT,
    step_order INTEGER
) AS $$
BEGIN
    -- Get all unique production steps that have data
    RETURN QUERY
    SELECT DISTINCT
        ps.step_code,
        ps.step_name,
        ROW_NUMBER() OVER (ORDER BY ps.step_code)::INTEGER as step_order
    FROM production_step ps
    WHERE EXISTS (
        -- Only include steps that have actual work data
        SELECT 1
        FROM plan p
        INNER JOIN plan_detail pd ON p.id = pd.plan_id
        INNER JOIN product pr ON pd.product_code = pr.product_code
        LEFT JOIN production_step_detail psd ON pr.id = psd.product_id AND ps.id = psd.production_step_id
        LEFT JOIN employee_salary_entry es ON p.id = es.plan_id 
            AND pr.id = es.product_id 
            AND psd.id = es.production_step_detail_id
        LEFT JOIN outsource_order_detail ood ON p.id = ood.plan_id 
            AND pr.id = ood.product_id 
            AND ps.id = ood.production_step_id
        LEFT JOIN outsource_order_receipt oor ON ood.id = oor.outsource_order_detail_id
        WHERE 
            (pr.product_code = input_product_code OR input_product_code IS NULL)
            AND (p.plan_code = input_plan_code OR input_plan_code IS NULL)
            AND (es.actual_quantity > 0 OR oor.receipt_quantity > 0 OR psd.id IS NOT NULL)
    )
    ORDER BY ps.step_code;
END;
$$ LANGUAGE plpgsql;

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