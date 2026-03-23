import { classifyIntent, generateResponse } from "../services/aiService.js";
import { db } from "@workspace/db";
import { clientsTable, conversationsTable, botConfigTable, productsTable, agentsTable } from "@workspace/db/schema";
import { eq, desc, ilike, and } from "drizzle-orm";

const AGENT_INTENT_MAP: Record<string, string> = {
  saludo: "sales", despedida: "sales", consulta_precio: "sales",
  consulta_producto: "sales", compra: "sales", objecion_precio: "sales",
  metodo_pago: "sales", desconocido: "sales", comparacion: "technical",
  especificacion_tecnica: "technical", soporte: "support", reclamo: "support",
  facturacion: "admin", ubicacion: "admin", horario: "admin",
  exportacion: "admin", importacion: "admin", envio_internacional: "admin", pedido: "admin",
};

async function getAgentPrompt(agentKey: string, fallback: string): Promise<string> {
  try {
    const agent = await db.query.agentsTable.findFirst({ where: eq(agentsTable.key, agentKey) });
    return agent?.systemPrompt || fallback;
  } catch { return fallback; }
}

async function getBotConfig() {
  let config = await db.query.botConfigTable.findFirst();
  if (!config) {
    const [c] = await db.insert(botConfigTable).values({}).returning();
    config = c;
  }
  return config;
}

async function getOrCreateClient(phone: string, name?: string) {
  let client = await db.query.clientsTable.findFirst({ where: eq(clientsTable.phone, phone) });
  if (!client) {
    const [c] = await db.insert(clientsTable).values({ phone, name: name || null, leadStatus: "cold", purchaseProbability: 0, technicalLevel: "basic", totalInteractions: 0 }).returning();
    client = c;
  }
  return client;
}

async function getHistory(clientId: number, limit: number) {
  const msgs = await db.select().from(conversationsTable).where(eq(conversationsTable.clientId, clientId)).orderBy(desc(conversationsTable.createdAt)).limit(limit);
  return msgs.reverse().map(m => ({ role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant", content: m.message }));
}

async function getProductContext(entities: Record<string, string>) {
  try {
    let products: typeof productsTable.$inferSelect[] = [];
    const { category, product, brand } = entities;
    if (category || product || brand) {
      const conds = [];
      if (category) conds.push(ilike(productsTable.category, `%${category}%`));
      if (brand) conds.push(ilike(productsTable.name, `%${brand}%`));
      if (product) conds.push(ilike(productsTable.name, `%${product}%`));
      products = await db.select().from(productsTable).where(conds.length ? and(...conds, eq(productsTable.isActive, true)) : eq(productsTable.isActive, true)).limit(5);
    }
    if (!products.length) {
      products = await db.select().from(productsTable).where(eq(productsTable.isActive, true)).limit(6);
    }
    if (!products.length) return "";
    return `PRODUCTOS DISPONIBLES EN INVENTARIO:\n${products.map(p =>
      `• ${p.name} | Precio: $${p.price} USD | Categoría: ${p.category}${p.brand ? " | Marca: " + p.brand : ""} | Stock: ${p.stock} unidades${p.description ? "\n  Descripción: " + p.description : ""}${p.imageUrl ? "\n  Imagen: " + p.imageUrl : ""}`
    ).join("\n")}`;
  } catch { return ""; }
}

export async function handleMessage(phone: string, message: string, clientName?: string) {
  const start = Date.now();
  const [client, botConfig] = await Promise.all([getOrCreateClient(phone, clientName), getBotConfig()]);

  if (!botConfig.isActive) {
    return { response: "El servicio está temporalmente suspendido. Contáctanos por otro canal.", intent: "desconocido", agent: "none", confidence: 0, clientId: String(client.id), processingTime: Date.now() - start };
  }

  const intentData = await classifyIntent(message);
  const agentKey = AGENT_INTENT_MAP[intentData.intent] || "sales";
  const history = await getHistory(client.id, botConfig.maxContextMessages);
  const productContext = await getProductContext(intentData.entities);

  const fallbackPrompt = `Eres ${botConfig.botName}, asistente de ${botConfig.businessName} (${botConfig.businessType}).
${botConfig.personality}
USA los productos disponibles para dar respuestas precisas y naturales. NUNCA inventes productos o precios.
Métodos de pago: ${botConfig.paymentMethods}. Horario: ${botConfig.workingHours}.
Habla de forma natural, cálida y profesional. NUNCA robótico. Máximo 3 párrafos.`;

  const systemPrompt = await getAgentPrompt(agentKey, fallbackPrompt);
  const fullPrompt = `${systemPrompt}

NEGOCIO: ${botConfig.businessName} | TIPO: ${botConfig.businessType}
MÉTODOS DE PAGO: ${botConfig.paymentMethods}
HORARIO: ${botConfig.workingHours}
${clientName || client.name ? `CLIENTE: ${clientName || client.name}` : ""}
INSTRUCCIÓN CRÍTICA: USA la información real de productos que se te da. No inventes datos.`;

  let response: string;
  try {
    response = await generateResponse(fullPrompt, productContext, message, history);
  } catch {
    response = botConfig.fallbackMessage;
  }

  await db.insert(conversationsTable).values([
    { clientId: client.id, role: "user", message, intent: intentData.intent, agent: agentKey, confidence: intentData.confidence },
    { clientId: client.id, role: "bot", message: response, intent: intentData.intent, agent: agentKey, confidence: intentData.confidence },
  ]);

  let newProbability = client.purchaseProbability || 0;
  if (["compra", "consulta_precio", "metodo_pago", "pedido"].includes(intentData.intent)) newProbability = Math.min(100, newProbability + 10);
  let leadStatus = client.leadStatus;
  if (newProbability >= 70) leadStatus = "hot";
  else if (newProbability >= 40) leadStatus = "warm";

  await db.update(clientsTable).set({ totalInteractions: (client.totalInteractions || 0) + 1, purchaseProbability: newProbability, leadStatus, lastInteraction: new Date(), name: clientName || client.name }).where(eq(clientsTable.id, client.id));

  return { response, intent: intentData.intent, agent: agentKey, confidence: intentData.confidence, clientId: String(client.id), processingTime: Date.now() - start };
}
