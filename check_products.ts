import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://postgres:6715320D@164.68.122.5:6433/whatsappdb?sslmode=disable" });
async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    console.log("Columns for 'products':", res.rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}
run();
