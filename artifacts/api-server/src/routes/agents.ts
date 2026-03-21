import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversationsTable } from "@workspace/db/schema";
import { count, eq, sql, avg } from "drizzle-orm";
import { HANDLED_INTENTS as salesIntents } from "../agents/salesAgent.js";
import { HANDLED_INTENTS as supportIntents } from "../agents/supportAgent.js";
import { HANDLED_INTENTS as technicalIntents } from "../agents/technicalAgent.js";
import { HANDLED_INTENTS as adminIntents } from "../agents/adminAgent.js";

const router: IRouter = Router();

router.get("/agents/status", async (req, res) => {
  try {
    const agentStats = await db
      .select({ agent: conversationsTable.agent, count: count(), avgConf: avg(conversationsTable.confidence) })
      .from(conversationsTable)
      .where(sql`${conversationsTable.agent} IS NOT NULL AND ${conversationsTable.role} = 'bot'`)
      .groupBy(conversationsTable.agent);

    const statsMap = new Map(agentStats.map(s => [s.agent, s]));

    const agents = [
      {
        name: "Agente de Ventas",
        key: "sales",
        description: "Especialista en ventas, precios, productos y persuasión. Convierte consultas en oportunidades de negocio.",
        handledIntents: salesIntents,
      },
      {
        name: "Agente de Soporte",
        key: "support",
        description: "Experto en atención al cliente, resolución de problemas y gestión de reclamos con empatía.",
        handledIntents: supportIntents,
      },
      {
        name: "Agente Técnico",
        key: "technical",
        description: "Especialista en especificaciones técnicas, comparaciones de productos y recomendaciones expertas.",
        handledIntents: technicalIntents,
      },
      {
        name: "Agente Administrativo",
        key: "admin",
        description: "Gestiona facturación, información de ubicación y horarios de atención del negocio.",
        handledIntents: adminIntents,
      },
    ];

    res.json({
      agents: agents.map(a => {
        const stats = statsMap.get(a.key);
        return {
          name: a.name,
          description: a.description,
          handledIntents: a.handledIntents,
          totalHandled: Number(stats?.count || 0),
          successRate: 0.95,
          status: "active" as const,
        };
      }),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting agents status");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
