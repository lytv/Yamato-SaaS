-- =============================================
-- Store Procedure: Employee Delivery/Receipt/Inventory Tracking
-- Description: Track Giao/Nhận/Tồn for each employee with employee filtering
-- Parameters: Plan Code, Product Code, Production Step Code, Employee ID (all optional)
-- File: sp_employee_delivery_receipt_inventory.sql
-- =============================================

CREATE OR REPLACE FUNCTION sp_employee_delivery_receipt_inventory(
    p_plan_code TEXT DEFAULT NULL,
    p_product_code TEXT DEFAULT NULL,
    p_production_step_code TEXT DEFAULT NULL,
    p_employee_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    employee_id TEXT,
    employee_name TEXT,
    plan_code TEXT,
    product_code TEXT,
    product_name TEXT,
    step_code TEXT,
    step_name TEXT,
    total_assigned INTEGER,
    total_received INTEGER,
    total_defect INTEGER,
    total_rework INTEGER,
    current_inventory INTEGER,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.user_id as employee_id,
        us.full_name as employee_name,
        p.plan_code,
        pr.product_code,
        pr.product_name,
        ps.step_code,
        ps.step_name,
        COALESCE(SUM(ood.ordered_quantity), 0)::INTEGER as total_assigned,
        COALESCE(SUM(oor.receipt_quantity), 0)::INTEGER as total_received,
        COALESCE(SUM(oor.defect_quantity), 0)::INTEGER as total_defect,
        COALESCE(SUM(oor.rework_quantity), 0)::INTEGER as total_rework,
        (COALESCE(SUM(ood.ordered_quantity), 0) - COALESCE(SUM(oor.receipt_quantity), 0))::INTEGER as current_inventory,
        CASE 
            WHEN SUM(ood.ordered_quantity) > 0 
            THEN ROUND((SUM(oor.receipt_quantity)::NUMERIC / SUM(ood.ordered_quantity)) * 100, 2)
            ELSE 0 
        END as completion_rate
    FROM user_sync us
    INNER JOIN outsource_order oo ON us.user_id = oo.assigned_to_user_id
    INNER JOIN outsource_order_detail ood ON oo.id = ood.outsource_order_id
    INNER JOIN plan p ON ood.plan_id = p.id
    INNER JOIN product pr ON ood.product_id = pr.id
    INNER JOIN production_step ps ON ood.production_step_id = ps.id
    LEFT JOIN outsource_order_receipt oor ON ood.id = oor.outsource_order_detail_id
    WHERE 
        (p.plan_code = p_plan_code OR p_plan_code IS NULL)
        AND (pr.product_code = p_product_code OR p_product_code IS NULL)
        AND (ps.step_code = p_production_step_code OR p_production_step_code IS NULL)
        AND (us.user_id = p_employee_id OR p_employee_id IS NULL)
    GROUP BY 
        us.user_id, 
        us.full_name, 
        p.plan_code, 
        pr.product_code, 
        pr.product_name, 
        ps.step_code, 
        ps.step_name
    ORDER BY 
        us.full_name, 
        p.plan_code, 
        pr.product_code, 
        ps.step_code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Usage Examples:
-- =============================================
-- 1. Lấy tất cả dữ liệu:
-- SELECT * FROM sp_employee_delivery_receipt_inventory();

-- 2. Lọc theo kế hoạch:
-- SELECT * FROM sp_employee_delivery_receipt_inventory('T.6');

-- 3. Lọc theo mã hàng:
-- SELECT * FROM sp_employee_delivery_receipt_inventory(NULL, 'NHA01');

-- 4. Lọc theo công đoạn:
-- SELECT * FROM sp_employee_delivery_receipt_inventory(NULL, NULL, 'MAY');

-- 5. Lọc theo nhân viên cụ thể:
-- SELECT * FROM sp_employee_delivery_receipt_inventory(NULL, NULL, NULL, 'user_123');

-- 6. Lọc theo tất cả tiêu chí:
-- SELECT * FROM sp_employee_delivery_receipt_inventory('T.6', 'NHA01', 'MAY', 'user_789');

-- =============================================
-- Migration Notes:
-- Run this SQL file to create the stored procedure
-- Command: psql -d your_database -f sp_employee_delivery_receipt_inventory.sql
-- =============================================