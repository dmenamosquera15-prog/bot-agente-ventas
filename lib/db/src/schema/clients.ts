import { pgTable, text, serial, timestamp, real, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 30 }).notNull().unique(),
  name: text("name"),
  email: text("email"),
  leadStatus: varchar("lead_status", { length: 20 }).notNull().default("cold"),
  purchaseProbability: real("purchase_probability").notNull().default(0),
  technicalLevel: varchar("technical_level", { length: 20 }).notNull().default("basic"),
  totalInteractions: integer("total_interactions").notNull().default(0),
  lastInteraction: timestamp("last_interaction"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({ id: true, createdAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
