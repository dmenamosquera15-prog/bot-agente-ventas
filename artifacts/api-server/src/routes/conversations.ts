import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversationsTable, clientsTable } from "@workspace/db/schema";
import { eq, count, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/conversations", async (req, res) => {
  try {
    const { clientId, limit = "50", offset = "0" } = req.query as Record<string, string>;

    const conversations = await db
      .select({
        clientId: clientsTable.id,
        clientPhone: clientsTable.phone,
        clientName: clientsTable.name,
        messageCount: count(conversationsTable.id),
        lastMessage: sql<string>`MAX(${conversationsTable.message})`,
        lastIntent: sql<string>`MAX(${conversationsTable.intent})`,
        lastAgent: sql<string>`MAX(${conversationsTable.agent})`,
        updatedAt: sql<string>`MAX(${conversationsTable.createdAt})`,
      })
      .from(conversationsTable)
      .innerJoin(clientsTable, eq(conversationsTable.clientId, clientsTable.id))
      .groupBy(clientsTable.id, clientsTable.phone, clientsTable.name)
      .orderBy(desc(sql`MAX(${conversationsTable.createdAt})`))
      .limit(Number(limit))
      .offset(Number(offset));

    const [total] = await db.select({ count: count() }).from(
      db.selectDistinct({ clientId: conversationsTable.clientId }).from(conversationsTable).as("sub")
    );

    res.json({
      data: conversations.map(c => ({
        id: String(c.clientId),
        clientId: String(c.clientId),
        clientPhone: c.clientPhone,
        clientName: c.clientName,
        lastMessage: c.lastMessage,
        lastIntent: c.lastIntent,
        lastAgent: c.lastAgent,
        messageCount: Number(c.messageCount),
        updatedAt: c.updatedAt,
      })),
      total: Number(total.count),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/conversations/:clientId", async (req, res) => {
  try {
    const clientId = Number(req.params.clientId);
    const messages = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.clientId, clientId))
      .orderBy(conversationsTable.createdAt);

    res.json({
      clientId: String(clientId),
      messages: messages.map(m => ({
        id: String(m.id),
        role: m.role,
        message: m.message,
        intent: m.intent,
        agent: m.agent,
        confidence: m.confidence,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting client conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
