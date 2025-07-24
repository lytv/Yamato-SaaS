-- =============================================
-- Store Procedure: Production Progress Pivot Report
-- Description: Pivot table showing production progress by product and steps
-- Input: Product Code, Plan Code
-- Output: Product | Plan | Planned Qty | Step1 | Step2 | Step3 |...
-- File: sp_production_progress_pivot.sql
-- =============================================

CREATE OR REPLACE FUNCTION sp_production_progress_pivot(
    p_product_code TEXT DEFAULT NULL,
    p_plan_code TEXT DEFAULT NULL
)
RETURNS TABLE (
    product_code TEXT,
    product_name TEXT,
    plan_code TEXT,
    plan_name TEXT,
    planned_quantity INTEGER,
    step_code_1 TEXT,
    step_name_1 TEXT,
    step_quantity_1 INTEGER,
    step_code_2 TEXT,
    step_name_2 TEXT,
    step_quantity_2 INTEGER,
    step_code_3 TEXT,
    step_name_3 TEXT,
    step_quantity_3 INTEGER,
    step_code_4 TEXT,
    step_name_4 TEXT,
    step_quantity_4 INTEGER,
    step_code_5 TEXT,
    step_name_5 TEXT,
    step_quantity_5 INTEGER,
    total_completed INTEGER,
    completion_rate NUMERIC
) AS $$
BEGIN
    -- Production Progress Pivot Report
    RETURN QUERY
    WITH production_data AS (
        -- Get planned quantities and actual work
        SELECT 
            pr.product_code as prod_code,
            pr.product_name as prod_name,
            p.plan_code as plan_code_val,
            p.plan_name as plan_name_val,
            COALESCE(SUM(pd.planned_quantity), 0)::INTEGER as planned_qty,
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
            (pr.product_code = p_product_code OR p_product_code IS NULL)
            AND (p.plan_code = p_plan_code OR p_plan_code IS NULL)
        GROUP BY pr.product_code, pr.product_name, p.plan_code, p.plan_name, ps.step_code, ps.step_name
    ),
    pivot_data AS (
        SELECT 
            prod_code,
            prod_name,
            plan_code_val,
            plan_name_val,
            planned_qty,
            step_code_val,
            step_name_val,
            step_qty,
            ROW_NUMBER() OVER (PARTITION BY prod_code, plan_code_val ORDER BY step_code_val) as step_rank
        FROM production_data
    )
    SELECT 
        prod_code as product_code,
        prod_name as product_name,
        plan_code_val as plan_code,
        plan_name_val as plan_name,
        planned_qty as planned_quantity,
        MAX(CASE WHEN step_rank = 1 THEN step_code_val END) as step_code_1,
        MAX(CASE WHEN step_rank = 1 THEN step_name_val END) as step_name_1,
        COALESCE(MAX(CASE WHEN step_rank = 1 THEN step_qty END), 0)::INTEGER as step_quantity_1,
        MAX(CASE WHEN step_rank = 2 THEN step_code_val END) as step_code_2,
        MAX(CASE WHEN step_rank = 2 THEN step_name_val END) as step_name_2,
        COALESCE(MAX(CASE WHEN step_rank = 2 THEN step_qty END), 0)::INTEGER as step_quantity_2,
        MAX(CASE WHEN step_rank = 3 THEN step_code_val END) as step_code_3,
        MAX(CASE WHEN step_rank = 3 THEN step_name_val END) as step_name_3,
        COALESCE(MAX(CASE WHEN step_rank = 3 THEN step_qty END), 0)::INTEGER as step_quantity_3,
        MAX(CASE WHEN step_rank = 4 THEN step_code_val END) as step_code_4,
        MAX(CASE WHEN step_rank = 4 THEN step_name_val END) as step_name_4,
        COALESCE(MAX(CASE WHEN step_rank = 4 THEN step_qty END), 0)::INTEGER as step_quantity_4,
        MAX(CASE WHEN step_rank = 5 THEN step_code_val END) as step_code_5,
        MAX(CASE WHEN step_rank = 5 THEN step_name_val END) as step_name_5,
        COALESCE(MAX(CASE WHEN step_rank = 5 THEN step_qty END), 0)::INTEGER as step_quantity_5,
        COALESCE(SUM(step_qty), 0)::INTEGER as total_completed,
        CASE 
            WHEN planned_qty > 0 
            THEN ROUND((SUM(step_qty)::NUMERIC / planned_qty) * 100, 2)
            ELSE 0 
        END as completion_rate
    FROM pivot_data
    GROUP BY prod_code, prod_name, plan_code_val, plan_name_val, planned_qty
    ORDER BY prod_code, plan_code_val;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Usage Examples:
-- =============================================
-- 1. Report for specific product and plan:
-- SELECT * FROM sp_production_progress_pivot('NHA01', '72025');

-- 2. Report for specific product only:
-- SELECT * FROM sp_production_progress_pivot('NHA01');

-- 3. Report for specific plan only:
-- SELECT * FROM sp_production_progress_pivot(NULL, '72025');

-- 4. Complete report:
-- SELECT * FROM sp_production_progress_pivot();

-- =============================================
-- Expected Output Format:
-- product_code | product_name | plan_code | plan_name | planned_quantity | step_code_1 | step_name_1 | step_quantity_1 | step_code_2 | step_name_2 | step_quantity_2 | ... | total_completed | completion_rate
-- NHA01        | Nhà 01       | 72025     | Tháng 7   | 900             | SONG        | Công đoạn Sóng | 80            | SUON        | Công đoạn Sưởn | 70            | ... | 210             | 23.33
-- =============================================
-- Migration Notes:
-- Run this SQL file to create the stored procedure
-- Command: psql -d your_database -f sp_production_progress_pivot.sql
-- =============================================