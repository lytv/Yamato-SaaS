-- =============================================
-- TEST QUERIES for Production Progress Pivot
-- Chạy từng query này để test từng bước
-- =============================================

-- TEST 1: Kiểm tra dữ liệu cơ bản
-- Lấy danh sách plans và products có planned_quantity > 0
SELECT 
    p.plan_code,
    p.plan_name,
    pr.product_code,
    pr.product_name,
    pd.planned_quantity
FROM plan p
INNER JOIN plan_detail pd ON p.id = pd.plan_id
INNER JOIN product pr ON pd.product_code = pr.product_code
WHERE pd.planned_quantity > 0
ORDER BY p.plan_code, pr.product_code
LIMIT 10;

-- TEST 2: Kiểm tra dữ liệu employee_salary_entry
SELECT 
    p.plan_code,
    pr.product_code,
    ps.step_code,
    ps.step_name,
    SUM(es.actual_quantity) as total_employee_quantity
FROM plan p
INNER JOIN plan_detail pd ON p.id = pd.plan_id
INNER JOIN product pr ON pd.product_code = pr.product_code
INNER JOIN production_step_detail psd ON pr.id = psd.product_id
INNER JOIN production_step ps ON psd.production_step_id = ps.id
LEFT JOIN employee_salary_entry es ON p.id = es.plan_id 
    AND pr.id = es.product_id 
    AND psd.id = es.production_step_detail_id
GROUP BY p.plan_code, pr.product_code, ps.step_code, ps.step_name
HAVING SUM(es.actual_quantity) > 0
ORDER BY p.plan_code, pr.product_code, ps.step_code
LIMIT 10;

-- TEST 3: Kiểm tra dữ liệu outsource_order_receipt
SELECT 
    p.plan_code,
    pr.product_code,
    ps.step_code,
    ps.step_name,
    SUM(oor.receipt_quantity) as total_outsource_quantity
FROM plan p
INNER JOIN plan_detail pd ON p.id = pd.plan_id
INNER JOIN product pr ON pd.product_code = pr.product_code
INNER JOIN outsource_order_detail ood ON p.id = ood.plan_id 
    AND pr.id = ood.product_id
INNER JOIN production_step ps ON ood.production_step_id = ps.id
LEFT JOIN outsource_order_receipt oor ON ood.id = oor.outsource_order_detail_id
GROUP BY p.plan_code, pr.product_code, ps.step_code, ps.step_name
HAVING SUM(oor.receipt_quantity) > 0
ORDER BY p.plan_code, pr.product_code, ps.step_code
LIMIT 10;

-- TEST 4: Test stored procedure (sau khi deploy)
-- Uncomment dòng dưới để test sau khi đã chạy stored procedure
-- SELECT * FROM sp_production_progress_pivot_dynamic(NULL, NULL) LIMIT 5;

-- TEST 5: Test với specific product code (thay YOUR_PRODUCT_CODE bằng mã thực tế)
-- Tìm 1 product_code từ TEST 1 rồi thay vào đây
-- SELECT * FROM sp_production_progress_pivot_dynamic('YOUR_PRODUCT_CODE', NULL) LIMIT 3;

-- TEST 6: Test JSON format
-- Uncomment để test JSON structure
-- SELECT 
--     product_code, 
--     plan_code, 
--     planned_quantity,
--     total_completed,
--     completion_rate,
--     jsonb_pretty(step_data) as formatted_step_data
-- FROM sp_production_progress_pivot_dynamic(NULL, NULL) 
-- WHERE step_data != '{}'::jsonb 
-- LIMIT 3;

-- TEST 7: Test column structure helper
-- SELECT * FROM sp_production_progress_pivot_columns(NULL, NULL) LIMIT 10;

-- =============================================
-- HƯỚNG DẪN TEST:
-- =============================================
-- 1. Chạy TEST 1, 2, 3 trước để kiểm tra dữ liệu cơ bản
-- 2. Nếu có dữ liệu, deploy stored procedure từ file sp_production_progress_pivot_dynamic_fixed.sql
-- 3. Chạy TEST 4 để kiểm tra stored procedure
-- 4. Nếu TEST 4 thành công, uncomment và chạy TEST 5, 6, 7
-- 5. Kiểm tra format JSON trong TEST 6
-- =============================================