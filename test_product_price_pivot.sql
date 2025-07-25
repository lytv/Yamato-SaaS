-- =============================================
-- TEST SCRIPT: Product Price Pivot Stored Procedure
-- =============================================

-- Test 1: Get all products with factory prices (first 3 records)
SELECT 
    product_code,
    product_name,
    total_steps,
    total_price,
    has_pricing,
    jsonb_pretty(step_data) as step_data_formatted
FROM sp_product_price_pivot(NULL, 'factory_price') 
WHERE has_pricing = true
LIMIT 3;

-- Test 2: Get specific product with all 3 price types
SELECT 'FACTORY PRICES' as test_type;
SELECT * FROM sp_product_price_pivot('NHA01', 'factory_price');

SELECT 'CALCULATED PRICES' as test_type;
SELECT * FROM sp_product_price_pivot('NHA01', 'calculated_price');

SELECT 'RETAIL PRICES' as test_type;
SELECT * FROM sp_product_price_pivot('NHA01', 'retail_price');

-- Test 3: Get available price types for dropdown
SELECT 'PRICE TYPES OPTIONS' as test_type;
SELECT * FROM sp_product_price_pivot_price_types();

-- Test 4: Get products with pricing for dropdown (first 10)
SELECT 'PRODUCTS WITH PRICING' as test_type;
SELECT * FROM sp_product_price_pivot_filter_products() LIMIT 10;

-- Test 5: Count products by price type availability
SELECT 'PRICE AVAILABILITY SUMMARY' as test_type;
SELECT 
    'Factory Price' as price_type,
    COUNT(*) as product_count
FROM sp_product_price_pivot(NULL, 'factory_price') 
WHERE has_pricing = true

UNION ALL

SELECT 
    'Calculated Price' as price_type,
    COUNT(*) as product_count
FROM sp_product_price_pivot(NULL, 'calculated_price') 
WHERE has_pricing = true

UNION ALL

SELECT 
    'Retail Price' as price_type,
    COUNT(*) as product_count
FROM sp_product_price_pivot(NULL, 'retail_price') 
WHERE has_pricing = true;

-- Test 6: Error handling - Invalid price type (should raise exception)
-- SELECT * FROM sp_product_price_pivot(NULL, 'invalid_price_type');

-- Test 7: Sample detailed view of step data structure
SELECT 
    product_code,
    product_name,
    total_steps,
    total_price,
    jsonb_object_keys(step_data) as step_codes,
    step_data
FROM sp_product_price_pivot(NULL, 'factory_price') 
WHERE has_pricing = true 
    AND total_steps > 3
LIMIT 2;

-- Test 8: Top 5 products with highest total price
SELECT 
    product_code,
    product_name,
    total_steps,
    total_price,
    has_pricing
FROM sp_product_price_pivot(NULL, 'factory_price') 
WHERE has_pricing = true 
ORDER BY total_price DESC
LIMIT 5;