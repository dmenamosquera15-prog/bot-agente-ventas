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
  "saludo", "despedida", "consulta_precio", "consulta_producto",
  "comparacion", "compra", "pedido", "objecion_precio", "soporte",
  "reclamo", "especificacion_tecnica", "metodo_pago", "facturacion",
  "ubicacion", "horario", "exportacion", "importacion", "envio_internacional", "desconocido",
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
  } catch { /* fallback */ }

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
    return { intent: r.intent || "desconocido", confidence: Math.min(1, Math.max(0, r.confidence || 0.5)), entities: r.entities || {} };
  } catch {
    return { intent: "desconocido", confidence: 0, entities: {} };
  }
}
export async function searchRelevantProducts(message: string, productNames: string[]): Promise<string[]> {
  try {
    const { client } = await getClient();
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Tu tarea es identificar EXACTAMENTE qué productos de la lista está buscando el cliente.
REGLAS:
- Si el cliente pregunta por un producto específico (ej: "curso de piano"), UNICAMENTE elige ese producto.
- No elijas "mega packs" o colecciones si el cliente busca un artículo individual.
- Si el mensaje es vago, elige máximo 2 relacionados.
- Si no hay coincidencia clara, devuelve "none".
PRODUCTOS EN CATÁLOGO: ${productNames.join(", ")}
Responde SOLO con los nombres exactos separados por comas, o "none".`,
        },
        { role: "user", content: `Mensaje: "${message}"` },
      ],
      temperature: 0,
    });
    
    const text = completion.choices[0]?.message?.content || "";
    if (text.toLowerCase() === "none") return [];
    return text.split(",").map(t => t.trim()).filter(t => productNames.includes(t));
  } catch {
    return [];
  }
}

export async function orchestrate(
  message: string, 
  history: Array<{ role: "user" | "assistant"; content: string }>,
  businessContext?: string
): Promise<string> {
  try {
    const { client } = await getClient();
    
    const agent = await db.query.agentsTable.findFirst({ 
      where: eq(agentsTable.key, 'orchestrator') 
    });

    const systemPrompt = agent?.systemPrompt || `Eres el ORQUESTADOR de ventas.
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
        ...history.slice(-5).map(h => ({ role: h.role, content: h.content })),
        { role: "user", content: `MENSAJE CLIENTE: "${message}"` },
      ],
      max_completion_tokens: 20,
      temperature: 0,
    });
    
    const decision = completion.choices[0]?.message?.content?.toLowerCase().trim() || "descubrimiento";
    const cleanDecision = decision.replace(/[^a-z_]/g, '');
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
  history: Array<{ role: "user" | "assistant"; content: string }>
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
    return completion.choices[0]?.message?.content || "Lo siento, no pude procesar tu mensaje.";
  } catch {
    return "Estoy teniendo dificultades técnicas. Por favor intenta en un momento.";
  }
}
