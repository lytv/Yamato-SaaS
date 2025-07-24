-- =============================================
-- TEST QUERIES for Satellite Progress Pivot (Tiến độ Vệ tinh)
-- Chạy từng query này để test từng bước
-- =============================================

-- TEST 1: Kiểm tra dữ liệu outsource_order_detail cơ bản
-- Lấy danh sách orders có assigned_to_user_id
SELECT 
    oo.id as order_id,
    ood.id as detail_id,
    p.plan_code,
    p.plan_name,
    pr.product_code,
    pr.product_name,
    ps.step_code,
    ps.step_name,
    ood.ordered_quantity,
    oo.assigned_to_user_id,
    us.full_name as user_name
FROM outsource_order oo
INNER JOIN outsource_order_detail ood ON oo.id = ood.outsource_order_id
INNER JOIN plan p ON ood.plan_id = p.id
INNER JOIN product pr ON ood.product_id = pr.id
INNER JOIN production_step ps ON ood.production_step_id = ps.id
LEFT JOIN user_sync us ON oo.assigned_to_user_id = us.user_id
WHERE ood.ordered_quantity > 0
  AND oo.assigned_to_user_id IS NOT NULL
ORDER BY p.plan_code, pr.product_code, oo.assigned_to_user_id
LIMIT 10;

-- TEST 2: Kiểm tra dữ liệu outsource_order_receipt
-- Lấy các receipt có quantity > 0
SELECT 
    ood.id as detail_id,
    p.plan_code,
    pr.product_code,
    ps.step_code,
    ps.step_name,
    oo.assigned_to_user_id,
    us.full_name as user_name,
    oor.receipt_quantity,
    oor.receipt_date
FROM outsource_order oo
INNER JOIN outsource_order_detail ood ON oo.id = ood.outsource_order_id
INNER JOIN plan p ON ood.plan_id = p.id
INNER JOIN product pr ON ood.product_id = pr.id
INNER JOIN production_step ps ON ood.production_step_id = ps.id
LEFT JOIN user_sync us ON oo.assigned_to_user_id = us.user_id
LEFT JOIN outsource_order_receipt oor ON ood.id = oor.outsource_order_detail_id
WHERE oor.receipt_quantity > 0
  AND oo.assigned_to_user_id IS NOT NULL
ORDER BY p.plan_code, pr.product_code, oo.assigned_to_user_id
LIMIT 10;

-- TEST 3: Kiểm tra unique users có assignment
-- Lấy danh sách các user được assign công việc
SELECT DISTINCT
    oo.assigned_to_user_id,
    us.full_name,
    COUNT(ood.id) as total_assignments,
    SUM(ood.ordered_quantity) as total_ordered
FROM outsource_order oo
INNER JOIN outsource_order_detail ood ON oo.id = ood.outsource_order_id
LEFT JOIN user_sync us ON oo.assigned_to_user_id = us.user_id
WHERE oo.assigned_to_user_id IS NOT NULL
GROUP BY oo.assigned_to_user_id, us.full_name
ORDER BY total_assignments DESC
LIMIT 10;

-- TEST 4: Test aggregation cho một user cụ thể
-- Thay 'USER_ID_HERE' bằng một user_id thực tế từ TEST 3
-- SELECT 
--     pr.product_code,
--     pr.product_name,
--     p.plan_code,
--     ps.step_code,
--     ps.step_name,
--     SUM(ood.ordered_quantity) as total_ordered,
--     SUM(COALESCE(oor.receipt_quantity, 0)) as total_received
-- FROM outsource_order oo
-- INNER JOIN outsource_order_detail ood ON oo.id = ood.outsource_order_id
-- INNER JOIN plan p ON ood.plan_id = p.id
-- INNER JOIN product pr ON ood.product_id = pr.id
-- INNER JOIN production_step ps ON ood.production_step_id = ps.id
-- LEFT JOIN outsource_order_receipt oor ON ood.id = oor.outsource_order_detail_id
-- WHERE oo.assigned_to_user_id = 'USER_ID_HERE'
-- GROUP BY pr.product_code, pr.product_name, p.plan_code, ps.step_code, ps.step_name
-- ORDER BY p.plan_code, pr.product_code, ps.step_code;

-- TEST 5: Test stored procedure sau khi deploy
-- Uncomment các dòng dưới để test sau khi đã chạy stored procedure

-- Test basic function:
-- SELECT * FROM sp_satellite_progress_pivot(NULL, NULL, NULL) LIMIT 5;

-- Test user filter function:
-- SELECT * FROM sp_satellite_progress_filter_users() LIMIT 10;

-- Test with specific user (thay USER_ID bằng user thực tế):
-- SELECT * FROM sp_satellite_progress_pivot(NULL, NULL, 'USER_ID') LIMIT 3;

-- TEST 6: Test JSON format (sau khi deploy stored procedure)
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
-- HƯỚNG DẪN TEST:
-- =============================================
-- 1. Chạy TEST 1, 2, 3 trước để kiểm tra dữ liệu cơ bản
-- 2. Từ TEST 3, chọn một assigned_to_user_id và thay vào TEST 4
-- 3. Nếu có dữ liệu, deploy stored procedure từ file sp_satellite_progress_pivot.sql
-- 4. Chạy TEST 5, 6 để kiểm tra stored procedure
-- 5. Kiểm tra format JSON và đảm bảo có dữ liệu step_data
-- =============================================

-- =============================================
-- SAMPLE EXPECTED OUTPUT:
-- =============================================
-- product_code | plan_code | assigned_user_name | planned_quantity | total_completed | step_data
-- NHA01       | 72025     | Nguyễn Văn A      | 100             | 80              | {"SONG": {"step_code": "SONG", "step_name": "Công đoạn Sóng", "quantity": 40}, "SUON": {"step_code": "SUON", "step_name": "Công đoạn Sưởn", "quantity": 40}}
-- =============================================