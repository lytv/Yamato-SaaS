CREATE OR REPLACE FUNCTION get_product_step_pivot_crosstab(
    p_owner_id TEXT,
    p_product_code TEXT,
    p_price_type INT
)
RETURNS TABLE(product_code TEXT, result JSONB)
LANGUAGE plpgsql
AS $$
DECLARE
    price_col TEXT;
    dyn_sql TEXT;
BEGIN
    -- Xác định cột giá
    IF p_price_type = 1 THEN
        price_col := 'factory_price';
    ELSE
        price_col := 'calculated_price';
    END IF;

    -- Build dynamic SQL trả về JSON object (pivot động)
    dyn_sql := format($f$
        SELECT
            p.product_code,
            jsonb_object_agg(
                ps.step_code,
                jsonb_build_object(
                    'price', psd.%I,
                    'step_name', ps.step_name
                ) ORDER BY ps.step_code
            ) AS result
        FROM
            product p
            JOIN production_step_detail psd ON p.id = psd.product_id
            JOIN production_step ps ON psd.production_step_id = ps.id
        WHERE
            p.owner_id = %L
            AND (%L IS NULL OR p.product_code = %L)
        GROUP BY p.product_code
    $f$, price_col, p_owner_id, p_product_code, p_product_code);

    RETURN QUERY EXECUTE dyn_sql;
END;
$$;

-- SELECT * FROM get_product_step_pivot_crosstab('owner1', NULL, 1);