import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://postgres:6715320D@164.68.122.5:6433/whatsappdb?sslmode=disable" });
async function run() {
  try {
    const res = await pool.query("SELECT id, name, category, price, stock, is_active FROM products WHERE name ILIKE '%piano%' OR category ILIKE '%piano%'");
    console.log("Piano Products:", res.rows);
    const countRes = await pool.query("SELECT COUNT(*) FROM products");
    console.log("Total Products:", countRes.rows[0].count);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
run();
