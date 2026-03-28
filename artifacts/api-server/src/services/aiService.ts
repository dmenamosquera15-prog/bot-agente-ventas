import OpenAI from "openai";
import { db } from "@workspace/db";
import { aiProvidersTable, agentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "kimi-k2.5:cloud";
const USE_OLLAMA = process.env.USE_OLLAMA === "true";

const KIMI_CONFIG = {
  temperature: 0.3,
  maxTokens: 600,
  topP: 0.85,
  frequencyPenalty: 0.3,
  presencePenalty: 0.2,
};

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

let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;
let lastErrorTime = 0;
const ERROR_COOLDOWN_MS = 60000;

async function getClient(): Promise<{ client: OpenAI; model: string; isOllama: boolean }> {
  const now = Date.now();

  // Circuit breaker
  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    if (now - lastErrorTime < ERROR_COOLDOWN_MS) {
      logger.warn("Circuit breaker activado - demasiados errores");
      throw new Error("Servicio IA no disponible temporalmente");
    }
    consecutiveErrors = 0;
  }

  // 0. OLLAMA (if enabled)
  if (USE_OLLAMA) {
    try {
      const client = new OpenAI({
        baseURL: OLLAMA_HOST,
        apiKey: "ollama",
        timeout: 60000,
        maxRetries: 2,
      });

      const response = await fetch(`${OLLAMA_HOST.replace('/v1', '')}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        logger.debug("Ollama health check passed");
        consecutiveErrors = 0;
        return { client, model: OLLAMA_MODEL, isOllama: true };
      }
    } catch (err: any) {
      logger.warn({ error: err.message }, "Ollama no disponible, usando fallback");
    }
  }

  // 1. DB PROVIDERS
  try {
    const provider = await db.query.aiProvidersTable.findFirst({
      where: eq(aiProvidersTable.isDefault, true),
    });
    if (provider && provider.apiKey && provider.apiKey.trim() !== "") {
      const client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseUrl || undefined,
        timeout: 30000,
      });
      consecutiveErrors = 0;
      return { client, model: provider.model || "gpt-4o", isOllama: false };
    }
  } catch (err: any) {
    console.error("DEBUG: DB provider fetch failed", err?.message);
  }

  // 2. GITHUB_TOKEN fallback
  if (process.env.GITHUB_TOKEN) {
    consecutiveErrors = 0;
    return {
      client: new OpenAI({
        baseURL: process.env.GITHUB_BASE_URL || "https://models.inference.ai.azure.com",
        apiKey: process.env.GITHUB_TOKEN,
        timeout: 30000,
      }),
      model: process.env.GITHUB_MODEL || "gpt-4o",
      isOllama: false,
    };
  }

  // No providers available
  lastErrorTime = now;
  consecutiveErrors++;
  throw new Error("No hay proveedores de IA disponibles");
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
  } catch (err: any) {
    console.error("DEBUG: classifyIntent FAILED!", err?.message);
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
  } catch (err: any) {
    console.error("DEBUG: searchRelevantProducts FAILED!", err?.message);
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
  } catch (err: any) {
    console.error("DEBUG: orchestrate FAILED!", err?.message);
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
      temperature: 0.4,
    } as OpenAI.ChatCompletionCreateParamsNonStreaming);
    return (
      completion.choices[0]?.message?.content ||
      "Lo siento, no pude procesar tu mensaje."
    );
  } catch (err: any) {
    console.error("DEBUG: generateResponse FAILED!", err?.message, err?.response?.data || "");
    return "Estoy teniendo dificultades técnicas. Por favor intenta en un momento.";
  }
}
export async function extractOrderData(
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<any | null> {
  try {
    const { client } = await getClient();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu tarea es extraer los datos de envío y el producto solicitado de la conversación para crear un pedido en WooCommerce.
Si faltan datos críticos (nombre, dirección, ciudad o producto), devuelve null.
IMPORTANTE: Identifica el producto EXACTO y la cantidad. Si el cliente no especificó cantidad, asume 1.
Responde SOLO JSON o null: 
{
  "first_name": "...", 
  "last_name": "...", 
  "address_1": "...", 
  "city": "...", 
  "phone": "...",
  "product_name": "...",
  "quantity": 1
}`,
        },
        ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const data = JSON.parse(completion.choices[0]?.message?.content || "null");
    if (!data || !data.product_name || !data.address_1 || !data.city) return null;
    return data;
  } catch (err) {
    console.error("DEBUG: extractOrderData FAILED!", err);
    return null;
  }
}
