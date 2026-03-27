import { pgTable, text, serial, timestamp, varchar, boolean, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tenantsTable = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  logoUrl: text("logo_url"),
  plan: varchar("plan", { length: 20 }).notNull().default("trial"),
  isActive: boolean("is_active").notNull().default(true),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const authUsersTable = pgTable("auth_users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  phone: varchar("phone", { length: 30 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  role: varchar("role", { length: 20 }).notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id).notNull(),
  plan: varchar("plan", { length: 20 }).notNull(), // trial | monthly | annual
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | active | expired | cancelled
  priceCOP: real("price_cop").notNull().default(0),
  paymentMethod: varchar("payment_method", { length: 30 }), // mercadopago | paypal
  paymentId: text("payment_id"),
  paymentLink: text("payment_link"),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenantsTable.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptionsTable.id),
  invoiceNumber: varchar("invoice_number", { length: 30 }).notNull().unique(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: varchar("client_phone", { length: 30 }),
  clientCity: varchar("client_city", { length: 100 }),
  clientCountry: varchar("client_country", { length: 100 }),
  description: text("description").notNull(),
  plan: varchar("plan", { length: 20 }).notNull(),
  priceCOP: real("price_cop").notNull(),
  tax: real("tax").notNull().default(0),
  total: real("total").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("issued"), // issued | paid | cancelled
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

export const insertTenantSchema = createInsertSchema(tenantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(authUsersTable).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true });

export type Tenant = typeof tenantsTable.$inferSelect;
export type AuthUser = typeof authUsersTable.$inferSelect;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type Invoice = typeof invoicesTable.$inferSelect;
