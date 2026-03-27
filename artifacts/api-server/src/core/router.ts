import {
  classifyIntent,
  generateResponse,
  orchestrate,
  searchRelevantProducts,
  extractOrderData,
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
Habla de forma natural, cálida y profesional. NUNCA robótico.`;

  // 4. Get the specialized system prompt
  const systemPrompt = await getAgentPrompt(agentKey, fallbackPrompt);

  const fullPrompt = `${systemPrompt}

NEGOCIO: ${botConfig.businessName} | TIPO: ${botConfig.businessType}
HORARIO: ${botConfig.workingHours}
MÉTODOS DE PAGO: ${botConfig.paymentMethods}
MONEDA: PESOS COLOMBIANOS (COP) 💰
${clientName || client.name ? `CLIENTE: ${clientName || client.name}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 INFORMACIÓN DE PAGO (SOLO USE ESTOS DATOS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${botConfig.bankName ? `🏦 Banco: ${botConfig.bankName}` : ""}
${botConfig.bankAccount ? `📋 Cuenta: ${botConfig.bankAccount} (${botConfig.bankAccountType || ""})` : ""}
${botConfig.bankOwner ? `👤 Titular: ${botConfig.bankOwner}` : ""}
${botConfig.nequiNumber ? `📱 Nequi: ${botConfig.nequiNumber}` : ""}
${botConfig.daviplataNumber ? `📱 Daviplata: ${botConfig.daviplataNumber}` : ""}
${botConfig.paypalEmail ? `💰 PayPal: ${botConfig.paypalEmail}` : ""}
${botConfig.mercadoPagoLink ? `💳 MercadoPago: ${botConfig.mercadoPagoLink}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ REGLAS CRÍTICAS - LÉELAS CON ATENCIÓN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PRIORIDAD #1 - MEMORIA Y CONTEXTO:
• ULTIMO PRODUCTO MENCIONADO: Siempre recuerda el último producto del que hablaste
• Cuando el cliente dice "ese", "ese mismo", "el mismo", "ese producto" → Se refiere AL MISMO PRODUCTO que mencionamos antes
• Si acabas de decir "El Mega Pack 81 tiene $60.000 COP" y el cliente pregunta "Y ese tiene garantía?"
  → DEBES responder sobre el Mega Pack 81
  → NO busques otros productos

🎯 PRIORIDAD #2 - ETAPA DE DESCUBRIMIENTO (cuando el cliente no sabe exactamente qué quiere):
• Si el cliente dice "quiero un portátil", "necesito algo para...", "qué me recomiendas?", "tienen...?"
  → NO muestres productos inmediatamente
  → Haz MAXIMO 1-2 PREGUNTAS para entender necesidades básicas
  → Ejemplos:
    - Si dice "para trabajo" → pregunta presupuesto
    - Si dice "para estudiar" → pregunta presupuesto
  → LUEGO muestra productos del catálogo
• El cliente espera VER productos, no muchas preguntas
• 1-2 preguntas = servicio profesional
• 3+ preguntas = experiencia frustrante

🎯 PRIORIDAD #3 - BÚSQUEDA DE PRODUCTOS:
• SIEMPRE busca productos en el catálogo ANTES de decir "no tenemos"
• Si el cliente pregunta por "portátil", "laptop", "computadora" → BUSCA productos con "Portatil" o "portátil"
• Si el cliente da un presupuesto (ej: "2 millones") → BUSCA productos menores a ese precio
• NUNCA digas "no tenemos productos" si ya mostraste productos antes en la conversación
• ULTIMO RECURSO: Si después de buscar NO hay productos, entonces dice "no tenemos"
• USA EMOJIS para dar formato, NO asteriscos (**)
• Ejemplo CORRECTO: "💰 Precio: $50.000 COP"
• Ejemplo INCORRECTO: "**Precio:** $50.000 COP"
• Usa emojis como: 💰 para precios, 🛒 para stock, ✅ para confirmaciones, ❌ para errores

🎯 PRIORIDAD #4 - PRECISIÓN ABSOLUTA:
• Los precios son en PESOS COLOMBIANOS (COP) 💰
• SIEMPRE muestra el símbolo $ antes del precio (ej: $150.000 COP)
• NUNCA digas precios en dólares
• NUNCA inventes información
• NUNCA inventes números de teléfono o contactos
• NUNCA digas que tienes dirección física si no la tienes
• Si no tienes la información, dice "No tengo esa información disponible"

🚫 PROHIBICIONES ABSOLUTAS:
• NO inventes URLs de imágenes
• NO inventes precios diferentes a los del catálogo
• NO inventes números de teléfono (el único contacto es el WhatsApp por donde escribes)
• NO inventes direcciones físicas
• NO inventes características de productos
• NO sugieras productos que no existen
• NO prometas fechas de entrega
• NO hagas descuentos no autorizados
• NO inventes métodos de pago - usa solo: ${botConfig.paymentMethods}

📋 REGLAS ESPECÍFICAS - FORMATO DE PRESENTACIÓN DE PRODUCTOS:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 PRESENTACIÓN DE PRODUCTO CON VALOR AGREGADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 FORMATO GENERAL:
━━━━━━━━━━━━━━
• NOMBRE DEL PRODUCTO (en mayúscula)
• Precio destacado
• Especificaciones clave (máx 4 puntos)
• Stock disponible
• Valor agregado único según categoría

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💻 PORTÁTILES (Laptops):
━━━━━━━━━━━━━━
Incluye en la respuesta:
• Procesador y RAM
• Almacenamiento SSD
• Tamaño de pantalla
• Valor agregado: "✅ GARANTÍA ORIGINAL | 🚚 ENVÍO gratis a toda Colombia | 💻 Seguro todo riesgo incluido"

📱 CELULARES Y ACCESORIOS:
━━━━━━━━━━━━━━
Incluye en la respuesta:
• Modelo compatible
• Característica principal
• Valor agregado: "✅ 100% original | 🔄 Cambio inmediato si no funciona | 🚚 Envío gratis"

🧹 PRODUCTOS DE LIMPIEZA/EQUIPOS:
━━━━━━━━━━━━━━
Incluye en la respuesta:
• Contenido/Tamaño
• Rendimiento
• Valor agregado: "✅ Calidad profesional | 📦 Envío inmediato"

🐕 PRODUCTOS PARA MASCOTAS:
━━━━━━━━━━━━━━
Incluye en la respuesta:
• Tamaño/Edad recomendada
• Material seguro
• Valor agregado: "❤️ Cuidado seguro | 🚚 Envío a todo Colombia"

📎 SUMINISTROS DE OFICINA:
━━━━━━━━━━━━━━
Incluye en la respuesta:
• Cantidad/Unidades
• Uso recomendado
• Valor agregado: "✅ Mejor precio del mercado | 📦 Envío inmediato"

💻 MEGA PACKS (CURSOS DIGITALES):
━━━━━━━━━━━━━━
Incluye en la respuesta:
• Cantidad de horas/contenido
• Lo que incluye (recursos, lecciones)
• Valor agregado: "✅ Acceso inmediato | 🎓 Certificado incluido | 🔐 Garantía de por vida"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 LLAMADAS A LA ACCIÓN (siempre incluir al final):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ¿Te interesa? → "✅ Lo quiero" = Datos de pago
• "¿Otra opción?" = Mostrar siguiente producto
• "¿Más información?" = Detalles técnicos
• "No me sirve" = Ofrecer alternativas

NUNCA termin sin dar una opción al cliente para avanzar en la compra.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 CATÁLOGO DISPONIBLE:
📦 ${productContext || "❌ SIN PRODUCTOS DISPONIBLES"}

💳 MÉTODOS DE PAGO:
💳 ${botConfig.paymentMethods}

INFORMACIÓN ADICIONAL:
${knowledgeContext || "❌ SIN INFORMACIÓN ADICIONAL"}

═══════════════════════════════════════════════════════════════════════════════
INSTRUCCIONES FINALES:
═══════════════════════════════════════════════════════════════════════════════

✓ SÉ ESPECÍFICO: Usa datos EXACTOS del contexto
✓ SÉ HONESTO: Admite cuando NO sabes algo
✓ SÉ CLARO: Organiza la información de forma legible
✓ SÉ PROFESIONAL: Tono cálido pero formal
✓ SÉ BREVE: Máximo 3 párrafos

❌ NUNCA ALUCINES - La reputación de la empresa depende de que hables la VERDAD

═══════════════════════════════════════════════════════════════════════════════`;

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
      // Intentar identificar el producto del contexto actual o del HISTORIAL RECIENTE
      const productRegex = /• ([^|]+) \| Precio: \$([0-9.]+)/;

      // 1. Buscar en el contexto actual
      const currentProducts = productContext.match(
        new RegExp(productRegex, "g"),
      );
      let productMatch = null;

      if (currentProducts && currentProducts.length > 0) {
        productMatch = productRegex.exec(currentProducts[0]);
      }

      // 2. Si no hay en contexto, BUSCAR EN HISTORIAL (Memoria Majestuosa)
      if (!productMatch && history.length > 0) {
        // Recorrer el historial de atrás hacia adelante (solo mensajes del asistente)
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].role === "assistant") {
            const histMatches = history[i].content.match(
              new RegExp(productRegex, "g"),
            );
            if (histMatches && histMatches.length > 0) {
              productMatch = productRegex.exec(histMatches[0]);
              if (productMatch) {
                logger.info(
                  { productName: productMatch[1] },
                  "Producto recuperado de la memoria majestuosa",
                );
                break;
              }
            }
          }
        }
      }

      if (productMatch) {
        const productName = productMatch[1].trim();
        const priceCOP = parseFloat(productMatch[2].replace(/\./g, ""));

        const links = [];

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
    }

    // --- AUTOMATIZACIÓN DE WOOCOMMERCE ---
    if (agentKey === "confirmacion" || intentData.intent === "pedido") {
      const orderData = await extractOrderData(history);
      if (
        orderData &&
        botConfig.wooCommerceUrl &&
        botConfig.wooCommerceConsumerKey
      ) {
        // Buscar el ID de producto en nuestra DB si es posible
        const dbProduct = await db.query.productsTable.findFirst({
          where: ilike(productsTable.name, `%${orderData.product_name}%`),
        });

        const wcOrder = await WooCommerceService.createOrder(
          {
            url: botConfig.wooCommerceUrl,
            ck: botConfig.wooCommerceConsumerKey,
            cs: botConfig.wooCommerceConsumerSecret || "",
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
