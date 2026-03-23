import { pgTable, text, serial, timestamp, boolean, varchar } from "drizzle-orm/pg-core";

export const aiProvidersTable = pgTable("ai_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: varchar("provider", { length: 30 }).notNull().default("openai"),
  apiKey: text("api_key").notNull().default(""),
  baseUrl: text("base_url"),
  model: text("model").notNull().default("gpt-5-mini"),
  isActive: boolean("is_active").notNull().default(false),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiProvider = typeof aiProvidersTable.$inferSelect;
