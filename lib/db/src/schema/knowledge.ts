import { pgTable, text, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";

export const conversationKnowledgeTable = pgTable("conversation_knowledge", {
  id: text("id").primaryKey(),
  userQuery: text("userQuery").notNull(),
  botResponse: text("botResponse").notNull(),
  context: text("context"),
  confidence: doublePrecision("confidence"),
  usageCount: integer("usageCount").default(0),
  successRate: doublePrecision("successRate").default(1),
  createdAt: timestamp("createdAt").defaultNow(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow(),
  productId: text("productId"),
  productName: text("productName"),
});
