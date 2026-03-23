import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

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

export async function classifyIntent(message: string): Promise<IntentResult> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: `Eres un clasificador de intenciones para un bot de ventas. Analiza el mensaje y devuelve SOLO un JSON válido.
Intenciones disponibles: ${INTENTS.join(", ")}
Responde ÚNICAMENTE con JSON, sin texto adicional.
Ejemplo: {"intent": "consulta_precio", "confidence": 0.95, "entities": {"category": "laptops", "brand": "HP"}}`,
        },
        {
          role: "user",
          content: `Mensaje: "${message}"`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 200,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return {
      intent: result.intent || "desconocido",
      confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
      entities: result.entities || {},
    };
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
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: `${systemPrompt}\n\nCONTEXTO DEL NEGOCIO:\n${context}` },
      ...history.slice(-10),
      { role: "user", content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      max_completion_tokens: 500,
    });

    return completion.choices[0]?.message?.content || "Lo siento, no pude procesar tu mensaje.";
  } catch {
    return "Lo siento, estoy teniendo problemas técnicos. Por favor intenta de nuevo.";
  }
}
