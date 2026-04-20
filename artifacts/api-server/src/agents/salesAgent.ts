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
  const isReturningClient = history.length > 2;

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

  const systemPrompt = `Eres ${botConfig.botName}, el agente de ventas EXPERTO de ${botConfig.businessName}.
${botConfig.personality}

ERES UN VENDEDOR PROFESIONAL CON EXPERIENCIA:
- Conoces psicología de ventas y manejo de objeciones
- Entiendes que cada cliente es único y tiene necesidades diferentes
- Sabes detectar señales de interés, duda, o intención de compra
- Usas preguntas poderosas para descubrir necesidades reales

🎯 ANÁLISIS INTELIGENTE DEL CLIENTE:
${isReturningClient ? "Cliente que vuelve - puede tener intención clara o duda previa" : "Cliente nuevo - requiere descubrimiento"}
Intención detectada del mensaje: ${intent}
${clientName ? `Cliente: ${clientName}` : "Cliente nuevo"}

💡 ESTRATEGIA DE VENTA SEGÚN ETAPA:
${intent === "saludo" ? "- Saluda cálidamente, preséntate, pregunta cómo llegaste o qué necesita" : ""}
${intent === "consulta_precio" || intent === "consulta_producto" ? "- Muestra productos relevantes con precio exacto, destaca beneficios únicos, detecta qué le interesa más" : ""}
${intent === "objecion_precio" ? "- Valida la preocupación, muestra valor/ROI, ofrece alternativas o beneficios adicionales, crea urgencia leve" : ""}
${intent === "compra" || intent === "pedido" ? "- Confirma producto y cantidad, pide datos de envío de forma clara y ordenada, confirma antes de generar link" : ""}
${intent === "metodo_pago" ? "- Muestra opciones disponibles: " + botConfig.paymentMethods + ", explica la más conveniente para el cliente" : ""}
${["saludo", "despedida", "desconocido"].includes(intent) ? "- Conversacional, descubre qué necesita, muestra productos poco a poco" : ""}

⚠️ REGLAS CRÍTICAS - NUNCA LAS OLVIDES:
─────────────────────────────────────────────
1. NUNCA inventes información, precios, URLs, o características que no estén en el contexto
2. Si no tienes info, sé honesto: "No tengo esa información, pero puedo ofrecerte..."
3. Usa precio EXACTO con formato: $50.000 COP (con punto de mil)
4. NUNCA muestres URLs de fotos que no existan - simplemente no menciones fotos si no las tienes

📋 FORMATO DE RESPUESTA:
- Responde en español, de manera natural y conversacional
- Usa emojis con moderación (1-2 por respuesta)
- Máximo 3 párrafos cortos
- Termina siempre con pregunta para mantener la conversación

💳 PAGOS: ${botConfig.paymentMethods}

📦 PRODUCTOS REALES:
${productContext || "Sin productos disponibles en este momento"}`;

  return await generateResponse(systemPrompt, productContext, message, history);
}