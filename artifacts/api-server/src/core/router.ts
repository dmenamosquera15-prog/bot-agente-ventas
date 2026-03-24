import { classifyIntent, generateResponse, orchestrate, searchRelevantProducts } from "../services/aiService.js";
import { db } from "@workspace/db";
import { clientsTable, conversationsTable, botConfigTable, productsTable, agentsTable, conversationKnowledgeTable } from "@workspace/db/schema";
import { eq, desc, ilike, and, or, sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";

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
      
      if (product) {
        const keywords = product.split(/\s+/).filter(k => k.length > 2);
        if (keywords.length > 0) {
          const productConds = keywords.map(kw => ilike(productsTable.name, `%${kw}%`));
          conds.push(and(...productConds));
        } else {
          conds.push(ilike(productsTable.name, `%${product}%`));
        }
      }
      
      products = await db.select().from(productsTable).where(conds.length ? and(...conds, eq(productsTable.isActive, true)) : eq(productsTable.isActive, true)).limit(5);
      
      if (!products.length && product) {
        const keywords = product.split(/\s+/).filter(k => k.length > 2);
        if (keywords.length > 0) {
          const productOrConds = keywords.map(kw => ilike(productsTable.name, `%${kw}%`));
          products = await db.select().from(productsTable).where(and(or(...productOrConds), eq(productsTable.isActive, true))).limit(5);
        }
      }
    }
    
    if (!products.length) {
      products = await db.select().from(productsTable).where(eq(productsTable.isActive, true)).limit(6);
    }
    
    if (!products.length) return "";
    return `CATÁLOGO DISPONIBLE:\n${products.map(p =>
      `• ${p.name} | Precio: $${p.price} USD | Categoría: ${p.category}${p.brand ? " | Marca: " + p.brand : ""} | Stock: ${p.stock} unidades${p.description ? "\n  Detalles: " + p.description : ""}`
    ).join("\n")}`;
  } catch (err) { 
    logger.error({ err }, "Error fetching product context");
    return ""; 
  }
}

async function getKnowledgeContext(query: string) {
  try {
    const keywords = query.split(/\s+/).filter(k => k.length > 3);
    if (keywords.length === 0) return "";

    const conds = keywords.map(kw => or(
      ilike(conversationKnowledgeTable.userQuery, `%${kw}%`),
      ilike(conversationKnowledgeTable.botResponse, `%${kw}%`)
    ));

    const kb = await db.select()
      .from(conversationKnowledgeTable)
      .where(or(...conds))
      .limit(3);

    if (!kb.length) return "";

    return `INFORMACIÓN ADICIONAL DE BASE DE CONOCIMIENTO:\n${kb.map(k => 
      `Pregunta Frecuente: ${k.userQuery}\nRespuesta Sugerida: ${k.botResponse}`
    ).join("\n---\n")}`;
  } catch (err) {
    logger.error({ err }, "Error fetching knowledge context");
    return "";
  }
}

export async function handleMessage(phone: string, message: string, clientName?: string) {
  const start = Date.now();
  const [client, botConfig] = await Promise.all([getOrCreateClient(phone, clientName), getBotConfig()]);

  if (!botConfig.isActive) {
    return { response: "El servicio está temporalmente suspendido.", intent: "desconocido", agent: "none", confidence: 0, clientId: String(client.id), processingTime: Date.now() - start };
  }

  // 1. Fetch History
  const history = await getHistory(client.id, botConfig.maxContextMessages);
  const intentData = await classifyIntent(message);

  // 2. SEARCH FOR PRODUCTS: Smart AI-driven search
  const allActiveProducts = await db.select({ name: productsTable.name }).from(productsTable).where(eq(productsTable.isActive, true));
  const productNames = allActiveProducts.map(p => p.name);
  
  const relevantProductNames = await searchRelevantProducts(message, productNames);
  let productContext = "";

  if (relevantProductNames.length > 0) {
    const products = await db.select().from(productsTable).where(
      and(sql`${productsTable.name} IN (${sql.join(relevantProductNames.map(n => sql`${n}`), sql`, `)})`, eq(productsTable.isActive, true))
    ).limit(5);
    
    productContext = `PRODUCTOS RELEVADOS PARA ESTA CONSULTA:\n${products.map(p =>
      `• ${p.name} | Precio: $${p.price} USD | Detalles: ${p.description || "N/A"}`
    ).join("\n")}`;
  } else {
    productContext = await getProductContext(intentData.entities);
  }

  const knowledgeContext = await getKnowledgeContext(message);

  // 3. ORCHESTRATE: Decide which specialized agent should respond
  // Use category summary for orchestrator
  const categories = [...new Set(allActiveProducts.map(p => p.name))].slice(0, 10).join(", "); // Simplified context
  const businessSummary = `NEGOCIO: ${botConfig.businessName}. CATALOGO: ${categories}.`;
  const agentKey = await orchestrate(message, history, businessSummary);

  const fallbackPrompt = `Eres ${botConfig.botName}, asistente de ${botConfig.businessName}.
${botConfig.personality}
Habla de forma natural, cálida y profesional. NUNCA robótico.`;

  // 4. Get the specialized system prompt
  const systemPrompt = await getAgentPrompt(agentKey, fallbackPrompt);
  
  const fullPrompt = `${systemPrompt}

NEGOCIO: ${botConfig.businessName} | TIPO: ${botConfig.businessType}
HORARIO: ${botConfig.workingHours}
${clientName || client.name ? `CLIENTE: ${clientName || client.name}` : ""}
CONTEXTO DE LA CONSULTA:
${productContext}
${knowledgeContext}

INSTRUCCIÓN: Sé lo más ESPECÍFICO posible. Si el cliente pregunta por UN producto en particular, respóndele únicamente sobre ese producto. No le ofrezcas "mega packs" o listas irrelevantes si ya encontraste lo que buscaba. Organiza la información de forma clara, atractiva y profesional.`;

  let response: string;
  try {
    const combinedContext = `${productContext}\n\n${knowledgeContext}`.trim();
    response = await generateResponse(fullPrompt, combinedContext, message, history);
  } catch {
    response = botConfig.fallbackMessage;
  }

  // Save to history
  await db.insert(conversationsTable).values([
    { clientId: client.id, role: "user", message, intent: intentData.intent, agent: agentKey, confidence: intentData.confidence },
    { clientId: client.id, role: "bot", message: response, intent: intentData.intent, agent: agentKey, confidence: intentData.confidence },
  ]);

  // Update lead status
  let newProbability = client.purchaseProbability || 0;
  if (["compra", "pedido"].includes(intentData.intent) || agentKey === "cierre") newProbability = Math.min(100, newProbability + 20);
  
  let leadStatus = client.leadStatus;
  if (newProbability >= 70) leadStatus = "hot";
  else if (newProbability >= 40) leadStatus = "warm";

  await db.update(clientsTable).set({ 
    totalInteractions: (client.totalInteractions || 0) + 1, 
    purchaseProbability: newProbability, 
    leadStatus, 
    lastInteraction: new Date(), 
    name: clientName || client.name || "Cliente WhatsApp"
  }).where(eq(clientsTable.id, client.id));

  return { response, intent: intentData.intent, agent: agentKey, confidence: intentData.confidence, clientId: String(client.id), processingTime: Date.now() - start };
}
