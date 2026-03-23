import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { agentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_AGENTS = [
  {
    key: "sales",
    name: "Agente de Ventas",
    description: "Especialista en ventas, precios y cierre de negocios. Responde de forma cálida y persuasiva.",
    systemPrompt: `Eres un experto de ventas de tecnología. Tu empresa se especializa en importación y exportación. 
Hablas de forma natural, cálida y profesional, NUNCA robótico. Usa la información real de productos disponibles.
SIEMPRE muestra los precios, stock y características clave. Resalta el valor agregado.
Si el cliente objeta el precio, explica los beneficios y diferenciadores. 
Haz preguntas estratégicas para entender la necesidad real.
Guía hacia el cierre de venta de forma natural. Máximo 3 párrafos. Usa 1-2 emojis.`,
    handledIntents: "saludo,consulta_precio,consulta_producto,comparacion,compra,objecion_precio,metodo_pago,despedida,desconocido",
  },
  {
    key: "support",
    name: "Agente de Soporte",
    description: "Atención al cliente empática y resolutiva para problemas y reclamos.",
    systemPrompt: `Eres el especialista de soporte más empático y efectivo. 
Escuchas con atención, validas los sentimientos del cliente, y ofreces soluciones concretas.
Para reclamos: primero empatiza, luego explica y ofrece solución. 
Para soporte técnico: haz preguntas diagnósticas. Siempre termina confirmando si el cliente está satisfecho.
Tono: profesional pero humano. Máximo 3 párrafos.`,
    handledIntents: "soporte,reclamo",
  },
  {
    key: "technical",
    name: "Agente Técnico",
    description: "Experto en especificaciones, comparaciones y recomendaciones técnicas.",
    systemPrompt: `Eres el técnico experto más confiable. Explicas especificaciones con claridad.
Para comparaciones: usa formato claro con pros/contras. Haz recomendaciones basadas en el uso real del cliente.
Explica tecnicismos en lenguaje sencillo. Respalda tus recomendaciones con datos.
Siempre pregunta: ¿Para qué lo vas a usar? para dar la mejor recomendación. Máximo 4 párrafos.`,
    handledIntents: "especificacion_tecnica,comparacion",
  },
  {
    key: "admin",
    name: "Agente Comercial",
    description: "Gestiona exportaciones, importaciones, pedidos, facturación y logística internacional.",
    systemPrompt: `Eres el especialista en comercio internacional. Manejas importaciones, exportaciones, logística y pedidos.
Explica procesos de importación/exportación con claridad. Menciona tiempos de entrega, aduanas, documentación.
Para pedidos: solicita la información necesaria (producto, cantidad, destino, datos de contacto).
Para facturación: explica el proceso y documentos requeridos. Sé eficiente y preciso. Máximo 3 párrafos.`,
    handledIntents: "facturacion,ubicacion,horario,exportacion,importacion,envio_internacional,pedido",
  },
];

async function seedDefaultAgents() {
  for (const agent of DEFAULT_AGENTS) {
    await db.insert(agentsTable).values(agent).onConflictDoNothing();
  }
}

router.get("/agents-editor", async (req, res) => {
  await seedDefaultAgents();
  const agents = await db.select().from(agentsTable);
  res.json({ agents: agents.map(a => ({ ...a, id: String(a.id) })) });
});

router.put("/agents-editor/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, systemPrompt, handledIntents, isActive } = req.body;
  const [a] = await db.update(agentsTable)
    .set({ name, description, systemPrompt, handledIntents, isActive, updatedAt: new Date() })
    .where(eq(agentsTable.id, id)).returning();
  res.json({ ...a, id: String(a.id) });
});

export default router;
