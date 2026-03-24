import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: "postgresql://postgres:6715320D@164.68.122.5:6433/whatsappdb?sslmode=disable" });

async function run() {
  const token = "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";
  const model = "gpt-4o";
  const baseUrl = "https://models.inference.ai.azure.com";

  try {
    console.log("Setting all providers to not default...");
    await pool.query('UPDATE "ai_providers" SET "is_default" = false');

    console.log("Checking if github_models exists...");
    const checkRes = await pool.query('SELECT id FROM "ai_providers" WHERE "provider" = $1', ['github_models']);

    const providerData = [
      "GitHub Models (Free Beta)",
      "github_models",
      token,
      baseUrl,
      model,
      true,
      true
    ];

    if (checkRes.rows.length > 0) {
      console.log("Updating existing GitHub Models provider...");
      await pool.query(
        'UPDATE "ai_providers" SET "name"=$1, "api_key"=$3, "base_url"=$4, "model"=$5, "is_active"=$6, "is_default"=$7 WHERE "id"=$8',
        [...providerData, checkRes.rows[0].id]
      );
    } else {
      console.log("Inserting new GitHub Models provider...");
      await pool.query(
        'INSERT INTO "ai_providers" ("name", "provider", "api_key", "base_url", "model", "is_active", "is_default") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        providerData
      );
    }
    console.log("GitHub Models provider setup complete!");
  } catch (err) {
    console.error("Error setting up provider:", err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
