import { pgTable, text, serial, timestamp, boolean, varchar } from "drizzle-orm/pg-core";

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 30 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  systemPrompt: text("system_prompt").notNull().default(""),
  handledIntents: text("handled_intents").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Agent = typeof agentsTable.$inferSelect;
