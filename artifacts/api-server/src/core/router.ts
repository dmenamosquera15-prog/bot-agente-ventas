import { classifyIntent } from "../services/aiService.js";
import * as salesAgent from "../agents/salesAgent.js";
import * as supportAgent from "../agents/supportAgent.js";
import * as technicalAgent from "../agents/technicalAgent.js";
import * as adminAgent from "../agents/adminAgent.js";
import { db } from "@workspace/db";
import { clientsTable, conversationsTable, botConfigTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

interface BotConfig {
  botName: string;
  personality: string;
  language: string;
  greetingMessage: string;
  fallbackMessage: string;
  maxContextMessages: number;
  isActive: boolean;
  businessName: string;
  businessType: string;
  paymentMethods: string;
  workingHours: string;
}

async function getOrCreateClient(phone: string, name?: string) {
  let client = await db.query.clientsTable.findFirst({
    where: eq(clientsTable.phone, phone),
  });

  if (!client) {
    const [newClient] = await db.insert(clientsTable).values({
      phone,
      name: name || null,
      leadStatus: "cold",
      purchaseProbability: 0,
      technicalLevel: "basic",
      totalInteractions: 0,
    }).returning();
    client = newClient;
  }

  return client;
}

async function getBotConfig(): Promise<BotConfig> {
  let config = await db.query.botConfigTable.findFirst();
  if (!config) {
    const [newConfig] = await db.insert(botConfigTable).values({}).returning();
    config = newConfig;
  }
  return config as BotConfig;
}

async function getConversationHistory(clientId: number, limit: number) {
  const messages = await db.select()
    .from(conversationsTable)
    .where(eq(conversationsTable.clientId, clientId))
    .orderBy(desc(conversationsTable.createdAt))
    .limit(limit);

  return messages.reverse().map(m => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.message,
  }));
}

function selectAgent(intent: string) {
  if (salesAgent.HANDLED_INTENTS.includes(intent)) return { agent: salesAgent, name: "sales" };
  if (supportAgent.HANDLED_INTENTS.includes(intent)) return { agent: supportAgent, name: "support" };
  if (technicalAgent.HANDLED_INTENTS.includes(intent)) return { agent: technicalAgent, name: "technical" };
  if (adminAgent.HANDLED_INTENTS.includes(intent)) return { agent: adminAgent, name: "admin" };
  return { agent: salesAgent, name: "sales" };
}

export async function handleMessage(phone: string, message: string, clientName?: string) {
  const start = Date.now();

  const [client, botConfig] = await Promise.all([
    getOrCreateClient(phone, clientName),
    getBotConfig(),
  ]);

  if (!botConfig.isActive) {
    return {
      response: "El bot está temporalmente desactivado. Por favor contacta al negocio directamente.",
      intent: "desconocido",
      agent: "none",
      confidence: 0,
      clientId: String(client.id),
      processingTime: Date.now() - start,
    };
  }

  const intentData = await classifyIntent(message);
  const { agent, name: agentName } = selectAgent(intentData.intent);

  const history = await getConversationHistory(client.id, botConfig.maxContextMessages);

  let response: string;
  try {
    response = await (agent as typeof salesAgent).handle(
      client.name,
      intentData,
      message,
      history,
      botConfig
    );
  } catch {
    response = botConfig.fallbackMessage;
  }

  // Save conversation
  await db.insert(conversationsTable).values([
    {
      clientId: client.id,
      role: "user",
      message,
      intent: intentData.intent,
      agent: agentName,
      confidence: intentData.confidence,
    },
    {
      clientId: client.id,
      role: "bot",
      message: response,
      intent: intentData.intent,
      agent: agentName,
      confidence: intentData.confidence,
    },
  ]);

  // Update client stats
  const newInteractions = (client.totalInteractions || 0) + 1;
  let newProbability = client.purchaseProbability || 0;
  if (["compra", "consulta_precio", "metodo_pago"].includes(intentData.intent)) {
    newProbability = Math.min(100, newProbability + 10);
  }
  let leadStatus = client.leadStatus;
  if (newProbability >= 70) leadStatus = "hot";
  else if (newProbability >= 40) leadStatus = "warm";

  await db.update(clientsTable)
    .set({
      totalInteractions: newInteractions,
      purchaseProbability: newProbability,
      leadStatus,
      lastInteraction: new Date(),
      name: clientName || client.name,
    })
    .where(eq(clientsTable.id, client.id));

  return {
    response,
    intent: intentData.intent,
    agent: agentName,
    confidence: intentData.confidence,
    clientId: String(client.id),
    processingTime: Date.now() - start,
  };
}
