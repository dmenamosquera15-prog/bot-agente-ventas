import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://postgres:6715320D@164.68.122.5:6433/whatsappdb?sslmode=disable" });
async function run() {
  try {
    const res = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log("Tables:", res.rows.map(r => r.tablename));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
run();
