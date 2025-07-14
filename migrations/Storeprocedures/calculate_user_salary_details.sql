CREATE OR REPLACE FUNCTION calculate_user_salary_details(
    p_user_ids TEXT[],
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    user_id TEXT,
    full_name TEXT,
    work_date DATE,
    source_table TEXT,
    product_code TEXT,
    product_name TEXT,
    step_code TEXT,
    step_name TEXT,
    quantity INT,
    unit_price NUMERIC(10, 2),
    line_total NUMERIC(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- CTE for Employee Salary Entries
    employee_salaries AS (
        SELECT
            ese.user_id,
            us.full_name,
            ese.work_date,
            'employee_salary' AS source_table,
            p.product_code,
            p.product_name,
            ps.step_code,
            ps.step_name,
            ese.actual_quantity AS quantity,
            psd.factory_price AS unit_price,
            (ese.actual_quantity * psd.factory_price) AS line_total
        FROM
            employee_salary_entry ese
        JOIN
            user_sync us ON ese.user_id = us.user_id
        JOIN
            production_step_detail psd ON ese.production_step_detail_id = psd.id
        JOIN
            product p ON psd.product_id = p.id
        JOIN
            production_step ps ON psd.production_step_id = ps.id
        WHERE
            ese.work_date BETWEEN p_start_date AND p_end_date
            AND (p_user_ids IS NULL OR ese.user_id = ANY(p_user_ids))
    ),
    -- CTE for Outsource Receipts
    outsource_salaries AS (
        SELECT
            oo.assigned_to_user_id AS user_id,
            us.full_name,
            oor.receipt_date AS work_date,
            'outsource_receipt' AS source_table,
            p.product_code,
            p.product_name,
            ps.step_code,
            ps.step_name,
            oor.receipt_quantity AS quantity,
            psd.calculated_price AS unit_price,
            (oor.receipt_quantity * psd.calculated_price) AS line_total
        FROM
            outsource_order_receipt oor
        JOIN
            outsource_order_detail ood ON oor.outsource_order_detail_id = ood.id
        JOIN
            outsource_order oo ON ood.outsource_order_id = oo.id
        JOIN
            user_sync us ON oo.assigned_to_user_id = us.user_id
        JOIN
            production_step_detail psd ON ood.product_id = psd.product_id AND ood.production_step_id = psd.production_step_id
        JOIN
            product p ON psd.product_id = p.id
        JOIN
            production_step ps ON psd.production_step_id = ps.id
        WHERE
            oor.receipt_date BETWEEN p_start_date AND p_end_date
            AND (p_user_ids IS NULL OR oo.assigned_to_user_id = ANY(p_user_ids))
    )
    -- Final Union and Ordering
    SELECT * FROM employee_salaries
    UNION ALL
    SELECT * FROM outsource_salaries
    ORDER BY user_id, work_date;
END;
$$ LANGUAGE plpgsql;