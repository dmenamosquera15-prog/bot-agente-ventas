import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("🔄 Ejecutando migración de columnas WooCommerce...");

    // Agregar columnas si no existen
    await pool.query(`
      ALTER TABLE bot_config 
      ADD COLUMN IF NOT EXISTS woo_commerce_url TEXT,
      ADD COLUMN IF NOT EXISTS woo_commerce_consumer_key TEXT,
      ADD COLUMN IF NOT EXISTS woo_commerce_consumer_secret TEXT
    `);

    console.log("✅ Migración completada exitosamente!");
  } catch (err) {
    console.error("❌ Error en migración:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
