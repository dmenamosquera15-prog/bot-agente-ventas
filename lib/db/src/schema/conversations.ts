import { pgTable, text, serial, timestamp, real, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  role: varchar("role", { length: 10 }).notNull(),
  message: text("message").notNull(),
  intent: varchar("intent", { length: 50 }),
  agent: varchar("agent", { length: 50 }),
  confidence: real("confidence"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({ id: true, createdAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;
