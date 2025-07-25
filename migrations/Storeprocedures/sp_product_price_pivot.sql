-- =============================================
-- Store Procedure: Product Price Pivot Report (Bảng giá theo công đoạn)
-- Description: Dynamic pivot table showing product prices by production steps
-- Input: Product Code Filter, Price Type (factory_price/calculated_price/retail_price)
-- Output: Product | All Dynamic Step Prices | Total Steps | Total Price
-- File: sp_product_price_pivot.sql
-- =============================================

-- Drop existing function first
DROP FUNCTION IF EXISTS sp_product_price_pivot(TEXT, TEXT);

CREATE OR REPLACE FUNCTION sp_product_price_pivot(
    filter_product_code TEXT DEFAULT NULL,
    price_type TEXT DEFAULT 'factory_price' -- factory_price, calculated_price, retail_price
)
RETURNS TABLE (
    product_code TEXT,
    product_name TEXT,
    step_data JSONB,
    total_steps INTEGER,
    total_price NUMERIC,
    has_pricing BOOLEAN
) AS $$
BEGIN
    -- Validate price_type parameter
    IF price_type NOT IN ('factory_price', 'calculated_price', 'retail_price') THEN
        RAISE EXCEPTION 'Invalid price_type. Must be one of: factory_price, calculated_price, retail_price';
    END IF;

    -- Product Price Pivot Report using JSON for flexibility
    RETURN QUERY
    WITH base_data AS (
        -- Get all products with their basic info
        SELECT DISTINCT
            prod.product_code AS base_product_code,
            prod.product_name AS base_product_name,
            prod.id AS base_product_id
        FROM product prod
        WHERE 
            (filter_product_code IS NULL OR prod.product_code = filter_product_code)
            AND prod.product_code IS NOT NULL
            AND prod.product_name IS NOT NULL
    ),
    step_prices AS (
        -- Get step prices based on selected price type
        SELECT 
            prod.product_code AS step_product_code,
            prod.id AS step_product_id,
            ps.step_code AS step_code_name,
            ps.step_name AS step_name_display,
            psd.sequence_number AS step_sequence,
            CASE 
                WHEN price_type = 'factory_price' THEN psd.factory_price
                WHEN price_type = 'calculated_price' THEN psd.calculated_price
                WHEN price_type = 'retail_price' THEN psd.retail_price
            END AS price_value
        FROM production_step_detail psd
        INNER JOIN product prod ON psd.product_id = prod.id
        INNER JOIN production_step ps ON psd.production_step_id = ps.id
        WHERE 
            (filter_product_code IS NULL OR prod.product_code = filter_product_code)
            AND (
                (price_type = 'factory_price' AND psd.factory_price IS NOT NULL)
                OR (price_type = 'calculated_price' AND psd.calculated_price IS NOT NULL)
                OR (price_type = 'retail_price' AND psd.retail_price IS NOT NULL)
            )
    ),
    final_aggregation AS (
        -- Create JSON object for each product with all step prices
        SELECT 
            bd.base_product_code,
            bd.base_product_name,
            COALESCE(
                jsonb_object_agg(
                    sp.step_code_name, 
                    jsonb_build_object(
                        'step_code', sp.step_code_name,
                        'step_name', sp.step_name_display,
                        'sequence_number', sp.step_sequence,
                        'price', sp.price_value
                    )
                ) FILTER (WHERE sp.step_code_name IS NOT NULL),
                '{}'::jsonb
            ) AS json_step_data,
            COALESCE(COUNT(sp.step_code_name), 0)::INTEGER AS total_step_count,
            COALESCE(SUM(sp.price_value), 0)::NUMERIC AS total_price_sum,
            CASE 
                WHEN COUNT(sp.step_code_name) > 0 AND SUM(sp.price_value) > 0 THEN true 
                ELSE false 
            END AS has_price_data
        FROM base_data bd
        LEFT JOIN step_prices sp ON bd.base_product_id = sp.step_product_id
        GROUP BY 
            bd.base_product_code, bd.base_product_name
    )
    SELECT 
        fa.base_product_code::TEXT as product_code,
        fa.base_product_name::TEXT as product_name,
        fa.json_step_data as step_data,
        fa.total_step_count as total_steps,
        fa.total_price_sum as total_price,
        fa.has_price_data as has_pricing
    FROM final_aggregation fa
    ORDER BY fa.base_product_code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Helper Function: Get Available Price Types
-- =============================================

DROP FUNCTION IF EXISTS sp_product_price_pivot_price_types();

CREATE OR REPLACE FUNCTION sp_product_price_pivot_price_types()
RETURNS TABLE (
    price_type TEXT,
    price_label TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'factory_price'::TEXT as price_type,
        'Đơn giá xưởng'::TEXT as price_label,
        'Giá sản xuất tại xưởng'::TEXT as description
    UNION ALL
    SELECT 
        'calculated_price'::TEXT as price_type,
        'Đơn giá về tính'::TEXT as price_label,
        'Giá tính toán chi phí'::TEXT as description
    UNION ALL
    SELECT 
        'retail_price'::TEXT as price_type,
        'Đơn giá bán lẻ'::TEXT as price_label,
        'Giá bán lẻ cho khách hàng'::TEXT as description;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Helper Function: Get Products Filter Options
-- =============================================

DROP FUNCTION IF EXISTS sp_product_price_pivot_filter_products();

CREATE OR REPLACE FUNCTION sp_product_price_pivot_filter_products()
RETURNS TABLE (
    product_code TEXT,
    product_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        prod.product_code::TEXT,
        prod.product_name::TEXT
    FROM product prod
    INNER JOIN production_step_detail psd ON prod.id = psd.product_id
    WHERE prod.product_code IS NOT NULL
        AND prod.product_name IS NOT NULL
        AND (
            psd.factory_price IS NOT NULL 
            OR psd.calculated_price IS NOT NULL 
            OR psd.retail_price IS NOT NULL
        )
    ORDER BY prod.product_code;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Test SQL Commands
-- =============================================

-- Test 1: Get all products with factory prices
-- SELECT * FROM sp_product_price_pivot(NULL, 'factory_price') LIMIT 5;

-- Test 2: Get specific product with calculated prices
-- SELECT * FROM sp_product_price_pivot('NHA01', 'calculated_price') LIMIT 5;

-- Test 3: Get all products with retail prices
-- SELECT * FROM sp_product_price_pivot(NULL, 'retail_price') LIMIT 5;

-- Test 4: Get available price types
-- SELECT * FROM sp_product_price_pivot_price_types();

-- Test 5: Get products for filter dropdown
-- SELECT * FROM sp_product_price_pivot_filter_products() LIMIT 10;

-- Test 6: Check JSON structure for a specific product
-- SELECT 
--     product_code, 
--     product_name,
--     total_steps,
--     has_pricing,
--     jsonb_pretty(step_data) as formatted_step_data
-- FROM sp_product_price_pivot('NHA01', 'factory_price')
-- WHERE step_data != '{}'::jsonb;

-- =============================================
-- Usage Examples:
-- =============================================
-- 1. Get all products with factory prices:
-- SELECT * FROM sp_product_price_pivot(NULL, 'factory_price');
-- 
-- 2. Get specific product with calculated prices:
-- SELECT * FROM sp_product_price_pivot('ABC123', 'calculated_price');
--
-- 3. Get all products with retail prices:
-- SELECT * FROM sp_product_price_pivot(NULL, 'retail_price');
--
-- 4. Get price type options for dropdown:
-- SELECT * FROM sp_product_price_pivot_price_types();
--
-- 5. Get product options for dropdown:
-- SELECT * FROM sp_product_price_pivot_filter_products();
--
-- =============================================
-- Migration Notes:
-- This procedure focuses on production_step_detail table
-- Uses JSONB for dynamic step columns supporting unlimited production steps
-- Includes price_type parameter validation
-- Returns structured data for frontend pivot table display
-- =============================================