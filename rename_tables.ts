import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://postgres:6715320D@164.68.122.5:6433/whatsappdb?sslmode=disable" });

async function run() {
  try {
    console.log("Renaming incompatible tables...");
    await pool.query('ALTER TABLE IF EXISTS "conversations" RENAME TO "bkp_conversations_old"');
    await pool.query('ALTER TABLE IF EXISTS "products" RENAME TO "bkp_products_old"');
    console.log("Tables renamed. Now re-running migration for these tables.");
    
    // The previous migration script will now see these tables are missing and create them.
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
run();
