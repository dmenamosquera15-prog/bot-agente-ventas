import OpenAI from "openai";
import { db } from "@workspace/db";
import { aiProvidersTable } from "@workspace/db/schema";
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
    model: "gpt-5-mini",
  };
}

export async function classifyIntent(message: string): Promise<IntentResult> {
  try {
    const { client } = await getClient();
    const completion = await client.chat.completions.create({
      model: "gpt-5-nano",
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
