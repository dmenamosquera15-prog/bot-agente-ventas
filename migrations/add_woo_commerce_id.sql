-- Migration: Add woo_commerce_id column to products table
-- This column stores the WooCommerce product ID for synchronization

ALTER TABLE products
ADD COLUMN IF NOT EXISTS woo_commerce_id INTEGER;

-- Create index for faster lookups when syncing with WooCommerce
CREATE INDEX IF NOT EXISTS idx_products_woo_commerce_id 
ON products(woo_commerce_id) 
WHERE woo_commerce_id IS NOT NULL;

-- Verify the column was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'woo_commerce_id';
