import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversationsTable, agentsTable } from "@workspace/db/schema";
import { count, sql, avg } from "drizzle-orm";

const router: IRouter = Router();

router.get("/agents/status", async (req, res) => {
  try {
    const agentStats = await db
      .select({ agent: conversationsTable.agent, count: count(), avgConf: avg(conversationsTable.confidence) })
      .from(conversationsTable)
      .where(sql`${conversationsTable.agent} IS NOT NULL AND ${conversationsTable.role} = 'bot'`)
      .groupBy(conversationsTable.agent);

    const statsMap = new Map(agentStats.map(s => [s.agent, s]));

    const dbAgents = await db.select().from(agentsTable).orderBy(agentsTable.id);

    const agents = dbAgents.map(a => {
      const stats = statsMap.get(a.key);
      return {
        id: String(a.id),
        key: a.key,
        name: a.name,
        description: a.description,
        handledIntents: a.handledIntents.split(",").map(i => i.trim()).filter(Boolean),
        totalHandled: Number(stats?.count || 0),
        successRate: stats ? Math.min(0.99, 0.8 + Number(stats.avgConf || 0) * 0.2) : 0,
        isActive: a.isActive,
        status: a.isActive ? "active" : "idle",
      };
    });

    res.json({ agents });
  } catch (err) {
    console.error("Error getting agents status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
