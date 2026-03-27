import { generateResponse } from "../services/aiService.js";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { ilike, eq } from "drizzle-orm";

export const HANDLED_INTENTS = ["especificacion_tecnica", "comparacion"];

export async function handle(
  clientName: string | null,
  intentData: { intent: string; entities: Record<string, string> },
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  botConfig: { businessName: string; botName: string },
): Promise<string> {
  const { intent, entities } = intentData;

  let products: (typeof productsTable.$inferSelect)[] = [];
  try {
    if (entities.product || entities.brand || entities.category) {
      const searchTerm =
        entities.product || entities.brand || entities.category || "";
      products = await db
        .select()
        .from(productsTable)
        .where(ilike(productsTable.name, `%${searchTerm}%`))
        .limit(3);
    }
    if (products.length === 0) {
      products = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.isActive, true))
        .limit(3);
    }
  } catch {
    /* ignore */
  }

  const productContext =
    products.length > 0
      ? `PRODUCTOS DISPONIBLES:\n${products.map((p) => `- ${p.name}: $${p.price} COP 💰 (${p.description || "Sin descripción adicional"})`).join("\n")}`
      : "";

  const systemPrompt = `Eres ${botConfig.botName}, el agente técnico especialista de ${botConfig.businessName}.

Tu rol: Experto técnico que explica especificaciones, compara productos y recomienda la mejor opción.
Intención: ${intent === "comparacion" ? "El cliente quiere comparar productos" : "El cliente quiere especificaciones técnicas detalladas"}
${clientName ? `Cliente: ${clientName}` : ""}

INSTRUCCIONES:
- Responde en español con detalle técnico apropiado
- Usa tablas o listas para comparaciones (formato de texto plano)
- Explica los tecnicismos en términos simples
- Haz recomendaciones basadas en necesidades específicas
- Para comparaciones: destaca pros y contras de cada opción
- Máximo 4 párrafos. Sé preciso y confiable
${productContext}`;

  return await generateResponse(systemPrompt, productContext, message, history);
}
