import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clientsTable, conversationsTable, productsTable } from "@workspace/db/schema";
import { count, eq, sql, avg, gte, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/metrics/dashboard", async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [[totalConvs], [totalClients], [hotLeads], [totalProducts], [msgs24h], [avgConf], topIntentResult] = await Promise.all([
      db.select({ count: count() }).from(conversationsTable),
      db.select({ count: count() }).from(clientsTable),
      db.select({ count: count() }).from(clientsTable).where(eq(clientsTable.leadStatus, "hot")),
      db.select({ count: count() }).from(productsTable).where(eq(productsTable.isActive, true)),
      db.select({ count: count() }).from(conversationsTable).where(gte(conversationsTable.createdAt, last24h)),
      db.select({ avg: avg(conversationsTable.confidence) }).from(conversationsTable),
      db.select({ intent: conversationsTable.intent, count: count() })
        .from(conversationsTable)
        .where(sql`${conversationsTable.intent} IS NOT NULL`)
        .groupBy(conversationsTable.intent)
        .orderBy(desc(count()))
        .limit(1),
      db.select({ count: count() }).from(clientsTable).where(gte(clientsTable.lastInteraction, last24h)),
    ]);

    const [activeToday] = await db.select({ count: count() }).from(clientsTable).where(gte(clientsTable.lastInteraction, last24h));

    res.json({
      totalConversations: Number(totalConvs.count),
      totalClients: Number(totalClients.count),
      hotLeads: Number(hotLeads.count),
      totalProducts: Number(totalProducts.count),
      messagesLast24h: Number(msgs24h.count),
      avgConfidence: Math.round((Number(avgConf.avg) || 0) * 100) / 100,
      topIntent: topIntentResult[0]?.intent || "N/A",
      activeClientsToday: Number(activeToday.count),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting dashboard metrics");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/metrics/intents", async (req, res) => {
  try {
    const results = await db
      .select({ intent: conversationsTable.intent, count: count() })
      .from(conversationsTable)
      .where(sql`${conversationsTable.intent} IS NOT NULL AND ${conversationsTable.role} = 'user'`)
      .groupBy(conversationsTable.intent)
      .orderBy(desc(count()));

    const total = results.reduce((sum, r) => sum + Number(r.count), 0);

    res.json({
      data: results.map(r => ({
        intent: r.intent || "desconocido",
        count: Number(r.count),
        percentage: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting intent metrics");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
