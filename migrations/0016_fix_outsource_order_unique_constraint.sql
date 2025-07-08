-- Migration: Fix outsource_order unique constraint conflict
-- Drop simple unique constraint on orderCode and keep composite constraint

-- Drop the simple unique constraint on order_code if it exists
ALTER TABLE outsource_order DROP CONSTRAINT IF EXISTS outsource_order_ordercode_unique;
ALTER TABLE outsource_order DROP CONSTRAINT IF EXISTS outsource_order_order_code_unique;

-- Alternative syntax for dropping unique constraint
DO $$ 
BEGIN
    -- Try to drop unique constraint by index name
    DROP INDEX IF EXISTS outsource_order_order_code_key;
    DROP INDEX IF EXISTS outsource_order_ordercode_key;
EXCEPTION 
    WHEN others THEN 
        RAISE NOTICE 'Simple unique constraint may not exist or already dropped';
END $$;

-- Ensure composite unique constraint exists
CREATE UNIQUE INDEX IF NOT EXISTS "order_code_owner_idx" 
ON "outsource_order" USING btree ("order_code","owner_id");

-- Verify the correct constraint is in place
-- The composite unique constraint allows same orderCode for different owners
-- But prevents duplicate orderCode within the same owner