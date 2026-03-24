import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://postgres:6715320D@164.68.122.5:6433/whatsappdb?sslmode=disable" });

async function run() {
  try {
    const filePath = "c:\\Users\\ADMIN\\Downloads\\davey\\Intelligent-Agent-System\\lib\\db\\drizzle\\0000_charming_proemial_gods.sql";
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql.split('--> statement-breakpoint');
    
    for (const stmt of statements) {
      if (!stmt.trim()) continue;
      try {
        console.log("Executing statement...");
        await pool.query(stmt);
      } catch (e) {
        if (e.message.includes("already exists")) {
          console.warn("Table already exists, skipping...");
        } else {
          throw e;
        }
      }
    }
    console.log("Migration complete!");
  } catch (err) {
    console.error("Error during migration:", err.message);
  } finally {
    await pool.end();
  }
}

run();
