import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, agentsTable, conversationsTable } from "@workspace/db/schema";
import { count, eq } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();

router.post("/admin/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  try {
    // Gather system stats for context
    const [prodCount] = await db.select({ value: count() }).from(productsTable);
    const [agentCount] = await db.select({ value: count() }).from(agentsTable);
    const [convCount] = await db.select({ value: count() }).from(conversationsTable);

    const context = `Eres el ASISTENTE ADMINISTRATIVO del sistema Bot Inteligente.
ESTADO ACTUAL:
- Productos en catálogo: ${prodCount?.value || 0}
- Agentes configurados: ${agentCount?.value || 0}
- Conversaciones totales: ${convCount?.value || 0}

Tu tarea es ayudar al administrador a entender cómo está funcionando el bot, qué productos hay o resolver dudas técnicas sobre la configuración.
Responde de forma profesional y concisa.`;

    const openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: context },
        { role: "user", content: message }
      ],
      max_completion_tokens: 500
    });

    res.json({ response: completion.choices[0]?.message?.content || "No tengo una respuesta en este momento." });
  } catch (err) {
    console.error("Admin chat error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
