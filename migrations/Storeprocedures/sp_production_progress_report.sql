-- =============================================
-- Store Procedure: Production Progress Report
-- Description: Detailed production progress tracking with total_made and absolute remaining
-- Input: Plan, Product Code, Production Step
-- Output: Employee work + Outsource delivery/receipt + Total Made + Absolute Remaining
-- File: sp_production_progress_report.sql
-- =============================================

CREATE OR REPLACE FUNCTION sp_production_progress_report(
    p_plan_code TEXT DEFAULT NULL,
    p_product_code TEXT DEFAULT NULL,
    p_production_step_code TEXT DEFAULT NULL
)
RETURNS TABLE (
    report_type TEXT,
    entity_id TEXT,
    entity_name TEXT,
    plan_code TEXT,
    product_code TEXT,
    product_name TEXT,
    step_code TEXT,
    step_name TEXT,
    total_planned INTEGER,
    total_actual INTEGER,
    total_assigned INTEGER,
    total_received INTEGER,
    total_defect INTEGER,
    total_made INTEGER,
    completion_rate NUMERIC,
    remaining_quantity INTEGER
) AS $$
BEGIN
    -- Employee Work Summary
    RETURN QUERY
    SELECT 
        'EMPLOYEE_SUMMARY'::TEXT as report_type,
        us.user_id::TEXT as entity_id,
        us.full_name::TEXT as entity_name,
        p.plan_code,
        pr.product_code,
        pr.product_name,
        ps.step_code,
        ps.step_name,
        COALESCE(SUM(es.planned_quantity), 0)::INTEGER as total_planned,
        COALESCE(SUM(es.actual_quantity), 0)::INTEGER as total_actual,
        0::INTEGER as total_assigned,
        0::INTEGER as total_received,
        0::INTEGER as total_defect,
        COALESCE(SUM(es.actual_quantity), 0)::INTEGER as total_made,
        CASE 
            WHEN SUM(es.planned_quantity) > 0 
            THEN ROUND((SUM(es.actual_quantity)::NUMERIC / SUM(es.planned_quantity)) * 100, 2)
            ELSE 0 
        END as completion_rate,
        ABS(COALESCE(SUM(es.planned_quantity), 0) - COALESCE(SUM(es.actual_quantity), 0))::INTEGER as remaining_quantity
    FROM employee_salary_entry es
    INNER JOIN user_sync us ON es.user_id = us.user_id
    INNER JOIN plan p ON es.plan_id = p.id
    INNER JOIN product pr ON es.product_id = pr.id
    INNER JOIN production_step_detail psd ON es.production_step_detail_id = psd.id
    INNER JOIN production_step ps ON psd.production_step_id = ps.id
    WHERE 
        (p.plan_code = p_plan_code OR p_plan_code IS NULL)
        AND (pr.product_code = p_product_code OR p_product_code IS NULL)
        AND (ps.step_code = p_production_step_code OR p_production_step_code IS NULL)
    GROUP BY us.user_id, us.full_name, p.plan_code, pr.product_code, pr.product_name, ps.step_code, ps.step_name

    UNION ALL

    -- Outsource User Details
    SELECT 
        'OUTSOURCE_DETAIL'::TEXT as report_type,
        us.user_id::TEXT as entity_id,
        us.full_name::TEXT as entity_name,
        p.plan_code,
        pr.product_code,
        pr.product_name,
        ps.step_code,
        ps.step_name,
        0::INTEGER as total_planned,
        0::INTEGER as total_actual,
        COALESCE(SUM(ood.ordered_quantity), 0)::INTEGER as total_assigned,
        COALESCE(SUM(oor.receipt_quantity), 0)::INTEGER as total_received,
        COALESCE(SUM(oor.defect_quantity), 0)::INTEGER as total_defect,
        COALESCE(SUM(oor.receipt_quantity), 0)::INTEGER as total_made,
        CASE 
            WHEN SUM(ood.ordered_quantity) > 0 
            THEN ROUND((SUM(oor.receipt_quantity)::NUMERIC / SUM(ood.ordered_quantity)) * 100, 2)
            ELSE 0 
        END as completion_rate,
        ABS(COALESCE(SUM(ood.ordered_quantity), 0) - COALESCE(SUM(oor.receipt_quantity), 0))::INTEGER as remaining_quantity
    FROM outsource_order oo
    INNER JOIN user_sync us ON oo.assigned_to_user_id = us.user_id
    INNER JOIN outsource_order_detail ood ON oo.id = ood.outsource_order_id
    INNER JOIN plan p ON ood.plan_id = p.id
    INNER JOIN product pr ON ood.product_id = pr.id
    INNER JOIN production_step ps ON ood.production_step_id = ps.id
    LEFT JOIN outsource_order_receipt oor ON ood.id = oor.outsource_order_detail_id
    WHERE 
        (p.plan_code = p_plan_code OR p_plan_code IS NULL)
        AND (pr.product_code = p_product_code OR p_product_code IS NULL)
        AND (ps.step_code = p_production_step_code OR p_production_step_code IS NULL)
    GROUP BY us.user_id, us.full_name, p.plan_code, pr.product_code, pr.product_name, ps.step_code, ps.step_name

    ORDER BY plan_code, product_code, step_code, report_type, entity_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Usage Examples:
-- =============================================
-- 1. Report for specific plan, product, step:
-- SELECT * FROM sp_production_progress_report('072025', 'NHA01', 'RAPCO');

-- 2. Report for specific plan only:
-- SELECT * FROM sp_production_progress_report('072025');

-- 3. Report for specific product only:
-- SELECT * FROM sp_production_progress_report(NULL, 'NHA01');

-- 4. Report for specific step only:
-- SELECT * FROM sp_production_progress_report(NULL, NULL, 'RAPCO');

-- 5. Complete report:
-- SELECT * FROM sp_production_progress_report();

-- =============================================
-- Updated Features:
-- - Added total_made column = total_actual + total_received
-- - Updated remaining_quantity to use ABS() for absolute values
-- - Handles negative remaining quantities by converting to positive
-- =============================================
-- Migration Notes:
-- Run this SQL file to create the stored procedure
-- Command: psql -d your_database -f sp_production_progress_report.sql
-- =============================================