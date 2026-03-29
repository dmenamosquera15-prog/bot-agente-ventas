import {
  classifyIntent,
  generateResponse,
  orchestrate,
  searchRelevantProducts,
  extractOrderData,
  getClient,
  executeAI,
  safeParseJSON,
} from "../services/aiService.js";
import { PaymentService } from "../services/paymentService.js";
import { WooCommerceService } from "../services/woocommerceService.js";
import { db } from "@workspace/db";
import {
  clientsTable,
  conversationsTable,
  botConfigTable,
  productsTable,
  agentsTable,
  conversationKnowledgeTable,
} from "@workspace/db/schema";
import { eq, desc, ilike, and, or, sql } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import OpenAI from "openai";

async function getAgentPrompt(
  agentKey: string,
  fallback: string,
): Promise<string> {
  try {
    const agent = await db.query.agentsTable.findFirst({
      where: eq(agentsTable.key, agentKey),
    });
    return agent?.systemPrompt || fallback;
  } catch {
    return fallback;
  }
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
  let client = await db.query.clientsTable.findFirst({
    where: eq(clientsTable.phone, phone),
  });
  if (!client) {
    const [c] = await db
      .insert(clientsTable)
      .values({
        phone,
        name: name || null,
        leadStatus: "cold",
        purchaseProbability: 0,
        technicalLevel: "basic",
        totalInteractions: 0,
      })
      .returning();
    client = c;
  }
  return client;
}

async function getHistory(clientId: number, limit: number) {
  const msgs = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.clientId, clientId))
    .orderBy(desc(conversationsTable.createdAt))
    .limit(limit);
  return msgs.reverse().map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.message,
  }));
}

async function getProductContext(entities: Record<string, string>) {
  try {
    let products: (typeof productsTable.$inferSelect)[] = [];
    const { category, product, brand } = entities;

    if (category || product || brand) {
      const conds = [];
      if (category) conds.push(ilike(productsTable.category, `%${category}%`));
      if (brand) conds.push(ilike(productsTable.name, `%${brand}%`));

      if (product) {
        // More flexible search: split keywords but use OR instead of AND
        const keywords = product.split(/\s+/).filter((k) => k.length > 2);
        if (keywords.length > 0) {
          // Use OR for keywords: "mega pack piano" should match either "mega", "pack", or "piano"
          const productConds = keywords.map((kw) =>
            ilike(productsTable.name, `%${kw}%`),
          );
          conds.push(or(...productConds));
        } else {
          conds.push(ilike(productsTable.name, `%${product}%`));
        }
      }

      products = await db
        .select()
        .from(productsTable)
        .where(
          conds.length
            ? and(...conds, eq(productsTable.isActive, true))
            : eq(productsTable.isActive, true),
        )
        .limit(5);

      // Secondary fallback if first search failed
      if (!products.length && product) {
        const keywords = product.split(/\s+/).filter((k) => k.length > 2);
        if (keywords.length > 0) {
          const productOrConds = keywords.map((kw) =>
            ilike(productsTable.name, `%${kw}%`),
          );
          products = await db
            .select()
            .from(productsTable)
            .where(and(or(...productOrConds), eq(productsTable.isActive, true)))
            .limit(5);
        } else {
          // Fallback: just search by the product string directly
          products = await db
            .select()
            .from(productsTable)
            .where(
              and(
                ilike(productsTable.name, `%${product}%`),
                eq(productsTable.isActive, true),
              ),
            )
            .limit(5);
        }
      }
    }

    if (!products.length) {
      products = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.isActive, true))
        .limit(6);
    }

    if (!products.length) return "";
    return `CATÁLOGO DISPONIBLE:\n${products
      .map(
        (p) =>
          `• ${p.name} | Precio: $${p.price} COP 💰 | Categoría: ${p.category}${p.brand ? " | Marca: " + p.brand : ""} | Stock: ${p.stock} unidades${p.description ? "\n  Detalles: " + p.description : ""}`,
      )
      .join("\n")}`;
  } catch (err) {
    logger.error({ err }, "Error fetching product context");
    return "";
  }
}

async function getKnowledgeContext(query: string) {
  try {
    const keywords = query.split(/\s+/).filter((k) => k.length > 3);
    if (keywords.length === 0) return "";

    const conds = keywords.map((kw) =>
      or(
        ilike(conversationKnowledgeTable.userQuery, `%${kw}%`),
        ilike(conversationKnowledgeTable.botResponse, `%${kw}%`),
      ),
    );

    const kb = await db
      .select()
      .from(conversationKnowledgeTable)
      .where(or(...conds))
      .limit(3);

    if (!kb.length) return "";

    return `INFORMACIÓN ADICIONAL DE BASE DE CONOCIMIENTO:\n${kb
      .map(
        (k) =>
          `Pregunta Frecuente: ${k.userQuery}\nRespuesta Sugerida: ${k.botResponse}`,
      )
      .join("\n---\n")}`;
  } catch (err) {
    logger.error({ err }, "Error fetching knowledge context");
    return "";
  }
}

export async function handleMessage(
  phone: string,
  message: string,
  clientName?: string,
) {
  const start = Date.now();
  const [client, botConfig] = await Promise.all([
    getOrCreateClient(phone, clientName),
    getBotConfig(),
  ]);

  if (!botConfig.isActive) {
    return {
      response: "El servicio está temporalmente suspendido.",
      intent: "desconocido",
      agent: "none",
      confidence: 0,
      clientId: String(client.id),
      processingTime: Date.now() - start,
    };
  }

  // 1. Fetch History
  const history = await getHistory(client.id, botConfig.maxContextMessages);
  const intentData = await classifyIntent(message);

  // 2. SEARCH FOR PRODUCTS: Smart AI-driven search with logging
  const allActiveProducts = await db
    .select({ name: productsTable.name })
    .from(productsTable)
    .where(eq(productsTable.isActive, true));
  const productNames = allActiveProducts.map((p) => p.name);

  let productContext = "";
  let searchMethod = "none";

  // Try semantic search first
  const relevantProductNames = await searchRelevantProducts(
    message,
    productNames,
  );

  if (relevantProductNames.length > 0) {
    searchMethod = "semantic";
    try {
      const products = await db
        .select()
        .from(productsTable)
        .where(
          and(
            sql`${productsTable.name} IN (${sql.join(
              relevantProductNames.map((n) => sql`${n}`),
              sql`, `,
            )})`,
            eq(productsTable.isActive, true),
          ),
        )
        .limit(5);

      if (products.length > 0) {
        productContext = `PRODUCTOS RELEVADOS PARA ESTA CONSULTA:\n${products
          .map(
            (p) =>
              `• ${p.name} | Precio: $${p.price} COP 💰 | Stock: ${p.stock} | Detalles: ${p.description || "N/A"}`,
          )
          .join("\n")}`;
      }
    } catch (err) {
      logger.error(
        { err, relevantProductNames },
        "Error querying products from semantic search",
      );
    }
  }

  // If semantic search failed, try SQL-based fallback
  if (!productContext) {
    searchMethod = "sql_fallback";
    productContext = await getProductContext(intentData.entities);
  }

  // ULTIMO RESCATE: Si después de todo NO hay productos, busca los más populares
  if (!productContext) {
    // Buscar cualquier producto activo como último recurso
    const fallbackProducts = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.isActive, true))
      .limit(3);

    if (fallbackProducts.length > 0) {
      searchMethod = "fallback_popular";
      productContext = `PRODUCTOS DISPONIBLES:\n${fallbackProducts
        .map(
          (p) => `• ${p.name} | Precio: $${p.price} COP 💰 | Stock: ${p.stock}`,
        )
        .join("\n")}`;
    }
  }

  // Log search result for monitoring
  logger.info(
    {
      phone,
      message,
      intent: intentData.intent,
      searchMethod,
      productsFound: productContext.length > 0 ? "yes" : "no",
    },
    "Product search result",
  );

  const knowledgeContext = await getKnowledgeContext(message);

  // 3. ORCHESTRATE: Decide which specialized agent should respond
  // Use category summary for orchestrator
  const categories = [...new Set(allActiveProducts.map((p) => p.name))]
    .slice(0, 10)
    .join(", "); // Simplified context
  const businessSummary = `NEGOCIO: ${botConfig.businessName}. CATALOGO: ${categories}.`;
  const agentKey = await orchestrate(message, history, businessSummary);

  const fallbackPrompt = `Eres ${botConfig.botName}, asistente de ${botConfig.businessName}.
${botConfig.personality}

🎯 ESTILO DE RESPUESTA:
• CORTO: Máximo 2-3 párrafos breves
• PROFESIONAL: Tono cálido pero formal, sin ser robótico
• VISUAL: Usa emojis con moderación para hacer la lectura fácil
• ESPACIADO: Deja líneas en blanco entre ideas
• INTERACTIVO: Termina siempre con una pregunta o llamada a la acción

📋 FORMATO DE PRODUCTOS FÍSICOS:
┌─────────────────────────────┐
│ 📱 NOMBRE DEL PRODUCTO      │
│ 💰 $Precio COP              │
│ ✨ 2-3 características clave│
│ 📦 Stock: X unidades        │
│ 🚚 Envío a todo el país     │
└─────────────────────────────┘

🎓 FORMATO MEGA PACKS (CURSOS DIGITALES):
┌─────────────────────────────┐
│ 🎓 NOMBRE DEL CURSO         │
│ 💰 $Precio COP              │
│ ⏱️ XX horas de contenido    │
│ 📚 XX lecciones + recursos  │
│ ⚡ ACCESO INMEDIATO         │
└─────────────────────────────┘
✅ Sin suscripciones - Pago único
✅ Acceso de por vida
✅ Sin certificados físicos

→ Opción clara: "✅ Lo quiero" o "¿Ver más?"

⚠️ REGLAS CLAVE:
• Precios SIEMPRE en COP con $ (ej: $50.000 COP)
• NUNCA inventes información
• Si no sabes, di "No tengo esa información"
• Recuerda el último producto mencionado (para "ese", "ese mismo")
• Máximo 1-2 preguntas de descubrimiento, luego muestra productos`;

  // 4. Get the specialized system prompt
  const systemPrompt = await getAgentPrompt(agentKey, fallbackPrompt);

  const fullPrompt = `${systemPrompt}

═══════════════════════════════════════════════════════════════
🏪 NEGOCIO: ${botConfig.businessName} | ${botConfig.businessType}
⏰ HORARIO: ${botConfig.workingHours}
💳 PAGOS: ${botConfig.paymentMethods}
💰 MONEDA: Pesos Colombianos (COP)
${clientName || client.name ? `👤 CLIENTE: ${clientName || client.name}` : ""}
═══════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│  💳 DATOS DE PAGO OFICIALES (USA SOLO ESTOS)                │
└──────────────────────────────────────────────────────────────┘
${botConfig.bankName ? `🏦 ${botConfig.bankName}: ${botConfig.bankAccount} (${botConfig.bankAccountType}) - Titular: ${botConfig.bankOwner}` : ""}
${botConfig.nequiNumber ? `📱 Nequi: ${botConfig.nequiNumber}` : ""}
${botConfig.daviplataNumber ? `📱 Daviplata: ${botConfig.daviplataNumber}` : ""}
${botConfig.paypalEmail ? `💰 PayPal: ${botConfig.paypalEmail}` : ""}
${botConfig.mercadoPagoLink ? `💳 MercadoPago: ${botConfig.mercadoPagoLink}` : ""}

────────────────────────────────────────────────────────────────

📦 CATÁLOGO DISPONIBLE:
${productContext || "❌ Sin productos registrados"}

💡 BASE DE CONOCIMIENTO:
${knowledgeContext || "❌ Sin información adicional"}

═══════════════════════════════════════════════════════════════
🎯 REGLAS DE ORO PARA VENDER (HUMANIZADO):
═══════════════════════════════════════════════════════════════

1. *TONO:* Sé un vendedor experto, carismático y muy amable. Usa frases como "¡Excelente elección!", "Te va a encantar", "Es de lo mejor que tenemos".

2. *FORMATO WHATSAPP:* 
   • Usa *negrita* para nombres de productos y precios.
   • Usa 👉 para señalar llamadas a la acción.
   • Usa ✅ para beneficios.
   • NUNCA uses cuadros de texto de tipo ASCII (como ┌─┐). Mantén el chat limpio.

3. *PRODUCTOS:* Presenta los productos de forma atractiva:
   ⭐ *[NOMBRE DEL PRODUCTO]*
   💰 *Precio:* $[Precio] COP
   ✨ *Beneficio:* [Un beneficio clave resumido]
   🚚 *Envío:* Inmediato a todo el país.
   
   👉 "¿Te gustaría que lo separemos para ti ahora mismo?"

4. *LONGITUD:* Mensajes cortos y fáciles de leer. Máximo 3 párrafos de 3 líneas cada uno. Deja aire (espacios) entre párrafos.

5. *LLAMADA A LA ACCIÓN (CTA):* Siempre termina con una pregunta o instrucción clara:
   • "¿Deseas conocer más detalles técnicos?"
   • "¡Escríbeme *'SÍ'* y te envío el link de pago seguro!"
   • "¿Tienes alguna duda sobre el envío?"

6. *EMOJIS:* Usa emojis variados pero profesionales (🚀, 💎, 📱, ✅, 📦) al inicio de las ideas.

═══════════════════════════════════════════════════════════════`;

  let response: string;
  try {
    const combinedContext = `${productContext}\n\n${knowledgeContext}`.trim();
    response = await generateResponse(
      fullPrompt,
      combinedContext,
      message,
      history,
    );

    // --- INTEGRACIÓN DE PAGOS DINÁMICOS (MEMORIA MAJESTUOSA) ---
    if (
      intentData.intent === "metodo_pago" ||
      intentData.intent === "compra" ||
      agentKey === "cierre"
    ) {
      // Usar IA para extraer el producto EXACTO que el cliente está pidiendo
      try {
        const extractedData = await executeAI(async (client, model) => {
          const completion = await client.chat.completions.create({
            model: model,
            messages: [
              {
                role: "system",
                content: `Extrae el producto EXACTO que el cliente está pidiendo para pagar. 
Si hay múltiples productos mencionados, identifica cuál es el que el cliente quiere AHORA.
Busca el nombre del producto y su precio en COP (sin puntos de mil).
Responde SOLO JSON:
{
  "product_name": "nombre exacto del producto",
  "price_cop": número
}
Si no encuentras información clara, devuelve null.`,
              },
              ...history.slice(-5).map((h) => ({
                role: h.role,
                content: h.content,
              })),
              {
                role: "user",
                content: message,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0,
          });

          return safeParseJSON(completion.choices[0]?.message?.content || "null");
        }, true);

        if (
          extractedData &&
          extractedData.product_name &&
          extractedData.price_cop
        ) {
          const productName = extractedData.product_name.trim();
          const priceCOP = extractedData.price_cop;

          const links = [];

          logger.info(
            { productName, priceCOP },
            "Producto extraído por IA para link de pago",
          );

          // Generar link de Mercado Pago (Colombia)
          if (
            botConfig.paymentMethods?.toLowerCase().includes("mercado") ||
            message.toLowerCase().includes("mercado")
          ) {
            const mpLink = await PaymentService.createMercadoPagoLink(
              productName,
              priceCOP,
            );
            if (mpLink)
              links.push(`💳 *Pago con Mercado Pago (COP):*\n${mpLink}`);
          }

          // Generar link de PayPal (Internacional)
          if (
            botConfig.paymentMethods?.toLowerCase().includes("paypal") ||
            message.toLowerCase().includes("paypal")
          ) {
            // Conversión aproximada a USD (TasaRef: 4000)
            const priceUSD = Math.round(priceCOP / 4000);
            const ppLink = await PaymentService.createPayPalLink(
              productName,
              priceUSD || 1,
            );
            if (ppLink) links.push(`💰 *Pago con PayPal (USD):*\n${ppLink}`);
          }

          if (links.length > 0) {
            response += `\n\n━━━━━━━━━━━━━━━━━━━━━\n🚀 *LINKS DE PAGO RÁPIDO:*\n${links.join("\n\n")}\n━━━━━━━━━━━━━━━━━━━━━`;
          }
        }
      } catch (err) {
        logger.error({ err }, "Error extrayendo producto para pago");
        // Fallback: Si falla la API, intentar con regex simple
        const productRegex = /• ([^|]+) \| Precio: \$([0-9.]+)/;
        const allMatches = (
          productContext + history.map((h) => h.content).join(" ")
        ).match(new RegExp(productRegex, "g"));
        if (allMatches && allMatches.length > 0) {
          const productMatch = productRegex.exec(
            allMatches[allMatches.length - 1],
          );
          if (productMatch) {
            const productName = productMatch[1].trim();
            const priceCOP = parseFloat(productMatch[2].replace(/\./g, ""));
            const links = [];

            if (
              botConfig.paymentMethods?.toLowerCase().includes("mercado") ||
              message.toLowerCase().includes("mercado")
            ) {
              const mpLink = await PaymentService.createMercadoPagoLink(
                productName,
                priceCOP,
              );
              if (mpLink)
                links.push(`💳 *Pago con Mercado Pago (COP):*\n${mpLink}`);
            }

            if (
              botConfig.paymentMethods?.toLowerCase().includes("paypal") ||
              message.toLowerCase().includes("paypal")
            ) {
              const priceUSD = Math.round(priceCOP / 4000);
              const ppLink = await PaymentService.createPayPalLink(
                productName,
                priceUSD || 1,
              );
              if (ppLink) links.push(`💰 *Pago con PayPal (USD):*\n${ppLink}`);
            }

            if (links.length > 0) {
              response += `\n\n━━━━━━━━━━━━━━━━━━━━━\n🚀 *LINKS DE PAGO RÁPIDO:*\n${links.join("\n\n")}\n━━━━━━━━━━━━━━━━━━━━━`;
            }
          }
        }
      }
    }

    // --- AUTOMATIZACIÓN DE WOOCOMMERCE ---
    if (agentKey === "confirmacion" || intentData.intent === "pedido") {
      const orderData = await extractOrderData(history);
      const wcConfig = botConfig as any; // Type casting para acceder a propiedades WooCommerce
      if (
        orderData &&
        wcConfig.wooCommerceUrl &&
        wcConfig.wooCommerceConsumerKey
      ) {
        // Buscar el ID de producto en nuestra DB si es posible
        const dbProduct = await db.query.productsTable.findFirst({
          where: ilike(productsTable.name, `%${orderData.product_name}%`),
        });

        const wcOrder = await WooCommerceService.createOrder(
          {
            url: wcConfig.wooCommerceUrl,
            ck: wcConfig.wooCommerceConsumerKey,
            cs: wcConfig.wooCommerceConsumerSecret || "",
          },
          {
            first_name: orderData.first_name,
            last_name: orderData.last_name,
            address_1: orderData.address_1,
            city: orderData.city,
            phone: orderData.phone || phone,
            line_items: [
              {
                product_id: (dbProduct as any)?.wooCommerceId || undefined,
                name: orderData.product_name,
                quantity: orderData.quantity || 1,
              },
            ],
          },
        );

        if (wcOrder && (wcOrder as any).id) {
          response += `\n\n✅ *PEDIDO PROCESADO:* Tu pedido #${(wcOrder as any).id} ha sido registrado en nuestro sistema de despachos.`;
          logger.info(
            { phone, wcOrderId: (wcOrder as any).id },
            "WooCommerce order triggered from chat",
          );
        }
      }
    }
  } catch {
    response = botConfig.fallbackMessage;
  }

  // Save to history
  await db.insert(conversationsTable).values([
    {
      clientId: client.id,
      role: "user",
      message,
      intent: intentData.intent,
      agent: agentKey,
      confidence: intentData.confidence,
    },
    {
      clientId: client.id,
      role: "bot",
      message: response,
      intent: intentData.intent,
      agent: agentKey,
      confidence: intentData.confidence,
    },
  ]);

  // Update lead status
  let newProbability = client.purchaseProbability || 0;
  if (["compra", "pedido"].includes(intentData.intent) || agentKey === "cierre")
    newProbability = Math.min(100, newProbability + 20);

  let leadStatus = client.leadStatus;
  if (newProbability >= 70) leadStatus = "hot";
  else if (newProbability >= 40) leadStatus = "warm";

  await db
    .update(clientsTable)
    .set({
      totalInteractions: (client.totalInteractions || 0) + 1,
      purchaseProbability: newProbability,
      leadStatus,
      lastInteraction: new Date(),
      name: clientName || client.name || "Cliente WhatsApp",
    })
    .where(eq(clientsTable.id, client.id));

  return {
    response,
    intent: intentData.intent,
    agent: agentKey,
    confidence: intentData.confidence,
    clientId: String(client.id),
    processingTime: Date.now() - start,
  };
}
