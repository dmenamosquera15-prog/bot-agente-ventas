#!/usr/bin/env node

/**
 * Migration Script: Add woo_commerce_id column to products table
 *
 * This script adds the woo_commerce_id column to the products table
 * to enable proper synchronization with WooCommerce.
 *
 * Usage:
 *   node add_woo_commerce_column.mjs
 *
 * Requirements:
 *   - DATABASE_URL environment variable must be set
 *   - Must have admin access to the PostgreSQL database
 */

import pg from "pg";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ Error: DATABASE_URL environment variable not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log("🔄 Starting migration: Adding woo_commerce_id column...\n");

    // Check if column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'woo_commerce_id'
    `;

    const result = await client.query(checkQuery);

    if (result.rows.length > 0) {
      console.log("✅ Column woo_commerce_id already exists!");
      return;
    }

    // Add the column
    console.log("📝 Adding woo_commerce_id column to products table...");
    await client.query(`
      ALTER TABLE products
      ADD COLUMN woo_commerce_id INTEGER
    `);
    console.log("✅ Column added successfully");

    // Create index for performance
    console.log("📊 Creating index for woo_commerce_id...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_woo_commerce_id 
      ON products(woo_commerce_id) 
      WHERE woo_commerce_id IS NOT NULL
    `);
    console.log("✅ Index created successfully");

    // Verify
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'woo_commerce_id'
    `;

    const verifyResult = await client.query(verifyQuery);
    if (verifyResult.rows.length > 0) {
      const col = verifyResult.rows[0];
      console.log("\n✅ Migration completed successfully!");
      console.log(`   Column: ${col.column_name}`);
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Nullable: ${col.is_nullable}`);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log("\n🎉 All done!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Unexpected error:", error);
    process.exit(1);
  });
