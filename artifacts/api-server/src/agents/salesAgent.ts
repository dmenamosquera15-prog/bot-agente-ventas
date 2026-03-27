import { generateResponse } from "../services/aiService.js";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { ilike, and, eq } from "drizzle-orm";

export const HANDLED_INTENTS = [
  "saludo",
  "despedida",
  "consulta_precio",
  "consulta_producto",
  "comparacion",
  "compra",
  "objecion_precio",
  "metodo_pago",
  "desconocido",
];

export async function handle(
  clientName: string | null,
  intentData: { intent: string; entities: Record<string, string> },
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  botConfig: {
    businessName: string;
    personality: string;
    paymentMethods: string;
    botName: string;
  },
): Promise<string> {
  const { intent, entities } = intentData;

  // Get relevant products
  let products: (typeof productsTable.$inferSelect)[] = [];
  try {
    if (entities.category || entities.product || entities.brand) {
      const conditions = [];
      if (entities.category)
        conditions.push(
          ilike(productsTable.category, `%${entities.category}%`),
        );
      if (entities.brand)
        conditions.push(
          ilike(
            productsTable.brand || productsTable.name,
            `%${entities.brand}%`,
          ),
        );
      if (entities.product)
        conditions.push(ilike(productsTable.name, `%${entities.product}%`));

      products = await db
        .select()
        .from(productsTable)
        .where(
          conditions.length > 0
            ? and(...conditions, eq(productsTable.isActive, true))
            : eq(productsTable.isActive, true),
        )
        .limit(5);
    } else if (intent !== "saludo" && intent !== "despedida") {
      products = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.isActive, true))
        .limit(5);
    }
  } catch {
    /* ignore */
  }

  const productContext =
    products.length > 0
      ? `PRODUCTOS DISPONIBLES:\n${products.map((p) => `- ${p.name}: $${p.price} COP 💰 (${p.category}, Stock: ${p.stock}${p.description ? ", " + p.description : ""})`).join("\n")}`
      : "";

  const systemPrompt = `Eres ${botConfig.botName}, el agente de ventas de ${botConfig.businessName}.
${botConfig.personality}

Tu rol: Asistente de ventas experto, amable, entusiasta y persuasivo. Ayudas a los clientes a encontrar los mejores productos.
Intención detectada: ${intent}
${clientName ? `Cliente: ${clientName}` : "Cliente nuevo"}
Métodos de pago disponibles: ${botConfig.paymentMethods}

⚠️ REGLA CRÍTICA - LEE CON ATENCIÓN:
────────────────────────────────────
NUNCA inventes información, precios, URLs de fotos o características que no estén EXACTAMENTE en el contexto de productos abajo.
- Si pregunta por algo que no existe: Confresa que no lo tienes y ofrece lo que sí tienes
- Si pregunta por foto: NUNCA inventes URL como "https://..."
- Si pregunta por precio: Muestra EXACTAMENTE lo que dice en el contexto
- Si pregunta por especificación no disponible: "No tengo esa información"

INSTRUCCIONES:
- Responde siempre en español, de manera natural y conversacional
- Si el cliente saluda, salúdalo calurosamente y pregunta en qué puedes ayudar
- Si pregunta por precio, muestra el precio EXACTO con formato de moneda
- Si hay objeción de precio, resalta el valor y calidad del producto
- Si pregunta por métodos de pago, explica SOLO las opciones disponibles: ${botConfig.paymentMethods}
- Máximo 3 párrafos cortos. Usa emojis con moderación (1-2 por respuesta)
- Siempre termina con una pregunta para mantener la conversación

CONTEXTO DE PRODUCTOS REALES - SOLO USA ESTO:
${productContext || "Sin productos disponibles en este momento"}`;

  return await generateResponse(systemPrompt, productContext, message, history);
}
