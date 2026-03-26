// Load environment variables first
import "dotenv/config.js";

import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

async function runMigrations() {
  try {
    logger.info("Verificando migraciones de base de datos...");

    await pool.query(`
      ALTER TABLE bot_config 
      ADD COLUMN IF NOT EXISTS woo_commerce_url TEXT,
      ADD COLUMN IF NOT EXISTS woo_commerce_consumer_key TEXT,
      ADD COLUMN IF NOT EXISTS woo_commerce_consumer_secret TEXT
    `);

    logger.info("Migraciones completadas");
  } catch (err: any) {
    logger.error({ err }, "Error en migraciones");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

runMigrations().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
});
