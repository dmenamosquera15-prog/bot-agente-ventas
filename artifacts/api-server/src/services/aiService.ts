import OpenAI from "openai";
import { db } from "@workspace/db";
import { aiProvidersTable, agentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: {
    category?: string;
    product?: string;
    brand?: string;
    priceRange?: string;
  };
}

const INTENTS = [
  "saludo",
  "despedida",
  "consulta_precio",
  "consulta_producto",
  "comparacion",
  "compra",
  "pedido",
  "objecion_precio",
  "soporte",
  "reclamo",
  "especificacion_tecnica",
  "metodo_pago",
  "facturacion",
  "ubicacion",
  "horario",
  "exportacion",
  "importacion",
  "envio_internacional",
  "desconocido",
];

async function getClient(): Promise<{ client: OpenAI; model: string }> {
  try {
    const provider = await db.query.aiProvidersTable.findFirst({
      where: eq(aiProvidersTable.isDefault, true),
    });
    if (provider && provider.apiKey) {
      const client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl || undefined,
      });
      return { client, model: provider.model };
    }
  } catch {
    /* fallback */
  }

  return {
    client: new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    }),
    model: "gpt-4o",
  };
}

export async function classifyIntent(message: string): Promise<IntentResult> {
  try {
    const { client } = await getClient();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Clasifica la intención del mensaje. Intenciones: ${INTENTS.join(", ")}.
Responde SOLO JSON: {"intent":"...","confidence":0.9,"entities":{"category":"...","product":"...","brand":"..."}}`,
        },
        { role: "user", content: `Mensaje: "${message}"` },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 150,
    });
    const r = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return {
      intent: r.intent || "desconocido",
      confidence: Math.min(1, Math.max(0, r.confidence || 0.5)),
      entities: r.entities || {},
    };
  } catch {
    return { intent: "desconocido", confidence: 0, entities: {} };
  }
}
export async function searchRelevantProducts(
  message: string,
  productNames: string[],
): Promise<string[]> {
  try {
    const { client } = await getClient();

    // Normalization helper: remove diacritics, punctuation, emojis and collapse spaces
    const normalize = (s: string) =>
      s
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9\s]/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    // Build map of normalized product name -> original with multiple indices for fuzzy matching
    const normMap = new Map<string, string>();
    const productTokens = new Map<string, string[]>(); // normalized name -> tokens

    for (const n of productNames) {
      const norm = normalize(n);
      normMap.set(norm, n);
      productTokens.set(norm, norm.split(/\s+/));
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu tarea es identificar EXACTAMENTE qué productos de la lista está buscando el cliente.
REGLAS CRÍTICAS:
- Si el cliente menciona "piano", busca productos con "piano" en el nombre
- Si menciona "mega pack" o "pack", busca productos con eso
- Sé flexible: "mega packs" = "PACK 40 Mega Packs", "piano" = cualquier producto con piano
- Si no hay coincidencia CLARA, devuelve "none"
- Devuelve SOLO los nombres exactos de productos que sí coinciden
PRODUCTOS EN CATÁLOGO: ${productNames.join(" | ")}
Responde SOLO con los nombres exactos separados por comas, o "none".`,
        },
        { role: "user", content: `Mensaje: "${message}"` },
      ],
      temperature: 0,
    });

    const text = completion.choices[0]?.message?.content || "";

    if (normalize(text) === "none") return [];

    // Parse LLM output more robustly
    const candidates = text
      .split(/[,\n;|•]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const results = new Set<string>();

    // Multiple matching strategies for robustness
    for (const c of candidates) {
      const nn = normalize(c);

      // Strategy 1: Exact normalized match
      if (normMap.has(nn)) {
        results.add(normMap.get(nn)!);
        continue;
      }

      // Strategy 2: Substring match (both directions)
      for (const [k, orig] of normMap.entries()) {
        if (k.length === 0) continue;
        if (nn.includes(k) || k.includes(nn)) {
          results.add(orig);
          continue;
        }
      }

      // Strategy 3: Token-level matching (if at least 70% of tokens match)
      const cTokens = nn.split(/\s+/);
      for (const [k, origTokens] of productTokens.entries()) {
        const matchCount = cTokens.filter(
          (t) => origTokens.includes(t) && t.length > 2,
        ).length;
        const matchRatio =
          matchCount / Math.max(cTokens.length, origTokens.length);
        if (matchRatio >= 0.5) {
          results.add(normMap.get(k)!);
        }
      }
    }

    // Fallback: search the entire LLM response for product names
    if (results.size === 0) {
      const full = normalize(text);
      for (const [k, orig] of normMap.entries()) {
        if (k && full.includes(k)) results.add(orig);
      }
    }

    // Final validation: ensure all results are in original product list
    return Array.from(results)
      .filter((t) => productNames.includes(t))
      .slice(0, 5);
  } catch (err) {
    console.error("searchRelevantProducts error:", err);
    return [];
  }
}

export async function orchestrate(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  businessContext?: string,
): Promise<string> {
  try {
    const { client } = await getClient();

    const agent = await db.query.agentsTable.findFirst({
      where: eq(agentsTable.key, "orchestrator"),
    });

    const systemPrompt =
      agent?.systemPrompt ||
      `Eres el ORQUESTADOR de ventas.
Tu única tarea es devolver el nombre del agente adecuado según el mensaje y contexto.

AGENTES DISPONIBLES:
- saludo: Para cuando el cliente saluda o inicia contacto.
- descubrimiento: Para cuando el cliente tiene dudas generales o no sabe qué busca.
- interes_producto: Cuando menciona un producto específico o pregunta por catálogo.
- tecnico: Preguntas de especificaciones, compatibilidad o detalles técnicos.
- objeciones: Cuando tiene dudas de precio, desconfianza o peros.
- cierre: Cuando quiere comprar, precio final o métodos de pago.
- datos_envio: Cuando ya aceptó y hay que pedirle dirección/nombre.
- confirmacion: Confirmar pedido y dar las gracias.
- soporte: Reclamos, no llega el pedido o fallas.
- postventa: Fidelización o nuevas ofertas.

CONTEXTO NEGOCIO:
${businessContext || "Venta de productos generales."}

Responde SOLO el nombre del agente en minúsculas.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-5).map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: `MENSAJE CLIENTE: "${message}"` },
      ],
      max_completion_tokens: 20,
      temperature: 0,
    });

    const decision =
      completion.choices[0]?.message?.content?.toLowerCase().trim() ||
      "descubrimiento";
    const cleanDecision = decision.replace(/[^a-z_]/g, "");
    return cleanDecision;
  } catch (err) {
    console.error("Orchestration error:", err);
    return "descubrimiento";
  }
}

export async function generateResponse(
  systemPrompt: string,
  context: string,
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  try {
    const { client, model } = await getClient();
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: `${systemPrompt}\n\n${context}` },
      ...history.slice(-12),
      { role: "user", content: userMessage },
    ];
    const completion = await client.chat.completions.create({
      model,
      messages,
      max_completion_tokens: 600,
      temperature: 0.85,
    } as OpenAI.ChatCompletionCreateParamsNonStreaming);
    return (
      completion.choices[0]?.message?.content ||
      "Lo siento, no pude procesar tu mensaje."
    );
  } catch {
    return "Estoy teniendo dificultades técnicas. Por favor intenta en un momento.";
  }
}
