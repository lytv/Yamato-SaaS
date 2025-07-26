DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'outsource_order' 
        AND column_name = 'apply_retail_price'
    ) THEN
        ALTER TABLE "outsource_order" ADD COLUMN "apply_retail_price" integer DEFAULT 2 NOT NULL;
    END IF;
END $$;