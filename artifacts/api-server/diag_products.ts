import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://postgres:6715320D@164.68.122.5:6433/whatsappdb?sslmode=disable" });

async function run() {
  try {
    const cols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' ORDER BY ordinal_position`);
    console.log("products columns:", JSON.stringify(cols.rows, null, 2));

    // Try import via Drizzle mapping
    try {
      await pool.query(`
        INSERT INTO "products" ("name", "price", "category", "stock", "is_active")
        VALUES ('Test Product', 10.00, 'Test', 1, true)
      `);
      console.log("✅ Test insert OK");
      await pool.query(`DELETE FROM "products" WHERE "name" = 'Test Product'`);
    } catch (e: any) {
      console.error("❌ Insert error:", e.message);
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}
run();
