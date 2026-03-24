import { pgTable, text, serial, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tenantsTable = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  logoUrl: text("logo_url"),
  plan: varchar("plan", { length: 20 }).notNull().default("free"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const authUsersTable = pgTable("auth_users", {
  id: serial("id").primaryKey(),
  tenantId: serial("tenant_id").references(() => tenantsTable.id),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  role: varchar("role", { length: 20 }).notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const insertTenantSchema = createInsertSchema(tenantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(authUsersTable).omit({ id: true, createdAt: true });

export type Tenant = typeof tenantsTable.$inferSelect;
export type AuthUser = typeof authUsersTable.$inferSelect;
