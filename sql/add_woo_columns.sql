-- Agregar columnas de WooCommerce a bot_config si no existen
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS woo_commerce_url TEXT;
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS woo_commerce_consumer_key TEXT;
ALTER TABLE bot_config ADD COLUMN IF NOT EXISTS woo_commerce_consumer_secret TEXT;