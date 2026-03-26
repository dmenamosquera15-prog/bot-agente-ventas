import { Router } from "express";
import { pool } from "@workspace/db";

export const migrateRouter = Router();

migrateRouter.post("/migrate-woo", async (req: any, res: any) => {
  try {
    await pool.query(`
      ALTER TABLE bot_config 
      ADD COLUMN IF NOT EXISTS woo_commerce_url TEXT,
      ADD COLUMN IF NOT EXISTS woo_commerce_consumer_key TEXT,
      ADD COLUMN IF NOT EXISTS woo_commerce_consumer_secret TEXT
    `);
    res.json({ success: true, message: "Migración de WooCommerce completada" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
