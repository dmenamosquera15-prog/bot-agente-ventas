import OpenAI from "openai";
import { db } from "@workspace/db";
import { aiProvidersTable, agentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL_PRIMARY = process.env.OLLAMA_MODEL_PRIMARY || "kimi-k2.5:cloud";
const OLLAMA_MODEL_FALLBACK = process.env.OLLAMA_MODEL_FALLBACK || "glm-5:cloud";
const USE_OLLAMA = process.env.USE_OLLAMA === "true" || !!process.env.OLLAMA_HOST;

// Ollama models configuration
const OLLAMA_MODELS = {
  primary: OLLAMA_MODEL_PRIMARY,
  fallback: OLLAMA_MODEL_FALLBACK,
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

async function getClientInternal(
  preferFast: boolean = false, 
  triedIds: Set<string> = new Set()
): Promise<{ client: OpenAI, model: string, providerId: string }> {
  const now = Date.now();

  // 1. OLLAMA (Primary)
  if (USE_OLLAMA && !triedIds.has("ollama")) {
    try {
      const ollamaBaseUrl = OLLAMA_HOST.replace('/v1', '').replace('/api', '');
      const response = await fetch(`${ollamaBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2500)
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json() as any;
        const availableModels = data.models?.map((m: any) => m.name) || [];
        
        let selectedModel = OLLAMA_MODELS.primary;
        if (!availableModels.some((m: string) => m.includes(OLLAMA_MODELS.primary))) {
          selectedModel = availableModels.some((m: string) => m.includes(OLLAMA_MODELS.fallback)) 
            ? OLLAMA_MODELS.fallback 
            : (availableModels[0] || OLLAMA_MODELS.primary);
        }

        return {
          client: new OpenAI({ baseURL: `${ollamaBaseUrl}/v1`, apiKey: "ollama", timeout: 80000 }),
          model: selectedModel,
          providerId: "ollama"
        };
      }
    } catch (err) { /* silent fail to next */ }
  }

  // 2. DB PROVIDERS
  try {
    const providers = await db.query.aiProvidersTable.findMany({
      where: eq(aiProvidersTable.isActive, true),
      orderBy: (p, { desc }) => [desc(p.isDefault)]
    });

    for (const p of providers) {
      const pid = `db_${p.id}`;
      if (triedIds.has(pid) || !p.apiKey) continue;

      const defaultHeaders: Record<string, string> = {};
      if (
        p.provider === "github_copilot" || 
        p.provider === "github_models" || 
        p.baseUrl?.includes("github.com") || 
        p.baseUrl?.includes("azure.com")
      ) {
        defaultHeaders["Editor-Version"] = "vscode/1.95.3";
        defaultHeaders["User-Agent"] = "vscode-copilot";
      }

      return {
        client: new OpenAI({ 
          apiKey: p.apiKey, 
          baseURL: p.baseUrl || undefined, 
          timeout: 25000,
          defaultHeaders: Object.keys(defaultHeaders).length > 0 ? defaultHeaders : undefined
        }),
        model: preferFast ? (p.model?.replace('4o', '4o-mini') || "gpt-4o-mini") : (p.model || "gpt-4o"),
        providerId: pid
      };
    }
  } catch (err) { /* silent fail to next */ }

  // 3. GITHUB/ENV FALLBACK
  const githubId = "github_fallback";
  if (!triedIds.has(githubId)) {
    const finalKey = process.env.GITHUB_TOKEN || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    if (finalKey) {
      const baseUrl = process.env.GITHUB_BASE_URL || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://models.inference.ai.azure.com";
      logger.info({ provider: githubId }, "🛠️ Preparando Fallback de GitHub...");
      
      return {
        client: new OpenAI({ 
          baseURL: baseUrl, 
          apiKey: finalKey, 
          timeout: 45000,
          defaultHeaders: {
            "Editor-Version": "vscode/1.95.3",
            "User-Agent": "vscode-copilot",
          }
        }),
        model: preferFast ? "gpt-4o-mini" : (process.env.GITHUB_MODEL || "gpt-4o"),
        providerId: githubId
      };
    }
  }

  throw new Error("No hay proveedores de IA disponibles después de todos los intentos");
}

export async function getClient(preferFast: boolean = false) {
  return getClientInternal(preferFast);
}

export async function executeAI<T>(
  operation: (client: OpenAI, model: string) => Promise<T>,
  preferFast: boolean = false
): Promise<T> {
  const triedIds = new Set<string>();
  let lastError: any = null;

  for (let i = 0; i < 4; i++) {
    try {
      const { client, model, providerId } = await getClientInternal(preferFast, triedIds);
      return await operation(client, model);
    } catch (err: any) {
      lastError = err;
      const errorMsg = err.message?.toLowerCase() || "";
      const status = err.status;
      
      if (
        status === 429 || 
        status === 401 || 
        status === 403 || 
        errorMsg.includes("limit") || 
        errorMsg.includes("quota") ||
        errorMsg.includes("credit") ||
        errorMsg.includes("authenticated")
      ) {
        // Obtenemos el ID de quien falló para marcarlo
        // NOTA: getClientInternal sin triedIds nos da el que acabamos de intentar
        const current = await getClientInternal(preferFast, triedIds).catch(() => ({ providerId: "unknown" }));
        logger.warn({ provider: current.providerId, error: err.message }, "⚠️ Proveedor agotado o con error, rotando...");
        triedIds.add(current.providerId);
        continue;
      }
      
      logger.error({ error: err.message }, "❌ Error en llamada AI");
      throw err;
    }
  }
  throw lastError || new Error("Falla total de proveedores");
}

/**
 * Parsea JSON de forma segura eliminando bloques de código Markdown
 */
export function safeParseJSON(text: string): any {
  try {
    // Si ya es JSON limpio, parsear directo
    return JSON.parse(text);
  } catch {
    try {
      // Limpiar bloques de código Markdown ```json ... ``` o ``` ... ```
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleaned);
    } catch (err) {
      logger.error({ text }, "⚠️ Error parseando JSON de IA, reintentando limpieza agresiva...");
      // Intento final: buscar cualquier cosa que parezca un objeto entre { y }
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch { /* fail */ }
      }
      return null;
    }
  }
}

export async function classifyIntent(message: string): Promise<IntentResult> {
  return executeAI(async (client, model) => {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `Clasifica la intención del mensaje del cliente para un sistema de ventas. 
Intenciones: ${INTENTS.join(", ")}.
Responde SOLO JSON: {"intent":"...","confidence":0.9,"entities":{"category":"...","product":"...","brand":"..."}}`,
        },
        { role: "user", content: `Mensaje: "${message}"` },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 150,
      temperature: 0,
    });
    const content = completion.choices[0]?.message?.content || "{}";
    const r = safeParseJSON(content) || {};
    return {
      intent: r.intent || "desconocido",
      confidence: Math.min(1, Math.max(0, r.confidence || 0.5)),
      entities: r.entities || {},
    };
  }, true);
}

export async function searchRelevantProducts(
  message: string,
  productNames: string[],
): Promise<string[]> {
  return executeAI(async (client, model) => {
    const normalize = (s: string) =>
      s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9\s]/gi, "").replace(/\s+/g, " ").trim().toLowerCase();

    const normMap = new Map<string, string>();
    for (const n of productNames) {
      normMap.set(normalize(n), n);
    }

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `Identifica qué productos del catálogo busca el cliente. 
REGLAS:
- Si no hay coincidencia clara, devuelve "none".
- Devuelve SOLO los nombres exactos separados por comas.
CATÁLOGO: ${productNames.join(" | ")}`,
        },
        { role: "user", content: `Mensaje: "${message}"` },
      ],
      temperature: 0,
      max_completion_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content || "";
    if (normalize(text) === "none") return [];

    const candidates = text.split(/[,\n;|•]+/).map(t => t.trim()).filter(Boolean);
    const results = new Set<string>();

    for (const c of candidates) {
      const nn = normalize(c);
      if (normMap.has(nn)) {
        results.add(normMap.get(nn)!);
      } else {
        for (const [k, orig] of normMap.entries()) {
          if (k.includes(nn) || nn.includes(k)) results.add(orig);
        }
      }
    }

    return Array.from(results).slice(0, 5);
  }, true);
}

export async function orchestrate(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  businessContext?: string,
): Promise<string> {
  return executeAI(async (client, model) => {
    const agent = await db.query.agentsTable.findFirst({
      where: eq(agentsTable.key, "orchestrator"),
    });

    const systemPrompt = agent?.systemPrompt || `Eres el cerebro de un sistema de ventas. 
Tu tarea es decidir qué agente debe responder al cliente.

AGENTES:
- saludo, descubrimiento, interes_producto, tecnico, objeciones, cierre, datos_envio, confirmacion, soporte, postventa.

CONTEXTO: ${businessContext || "Venta general"}

Responde SOLO el nombre del agente en minúsculas.`;

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-5).map(h => ({ role: h.role, content: h.content })),
        { role: "user", content: message },
      ],
      max_completion_tokens: 20,
      temperature: 0,
    });

    return completion.choices[0]?.message?.content?.toLowerCase().replace(/[^a-z_]/g, "") || "descubrimiento";
  }, true);
}

export async function generateResponse(
  systemPrompt: string,
  context: string,
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  return executeAI(async (client, model) => {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: `${systemPrompt}\n\nCONTEXTO ADICIONAL:\n${context}` },
        ...history.slice(-10),
        { role: "user", content: userMessage },
      ],
      max_completion_tokens: 800,
      temperature: 0.7,
    });
    return completion.choices[0]?.message?.content || "Lo siento, hubo un error procesando tu respuesta.";
  });
}

export async function extractOrderData(
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<any | null> {
  return executeAI(async (client, model) => {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `Extrae datos de envío y producto del historial.
Responde SOLO JSON o null: 
{ "first_name": "...", "last_name": "...", "address_1": "...", "city": "...", "phone": "...", "product_name": "...", "quantity": 1 }`,
        },
        ...history.slice(-8),
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const content = completion.choices[0]?.message?.content || "null";
    const data = safeParseJSON(content);
    if (!data || !data.product_name || !data.address_1) return null;
    return data;
  }, true).catch(() => null);
}
