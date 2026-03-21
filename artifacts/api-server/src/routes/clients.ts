import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clientsTable } from "@workspace/db/schema";
import { eq, ilike, count, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/clients", async (req, res) => {
  try {
    const { status, limit = "50", offset = "0" } = req.query as Record<string, string>;
    
    let query = db.select().from(clientsTable);
    if (status) {
      query = query.where(eq(clientsTable.leadStatus, status)) as typeof query;
    }
    
    const [total] = await db.select({ count: count() }).from(clientsTable);
    const data = await query.orderBy(desc(clientsTable.lastInteraction)).limit(Number(limit)).offset(Number(offset));
    
    res.json({
      data: data.map(c => ({
        id: String(c.id),
        phone: c.phone,
        name: c.name,
        email: c.email,
        leadStatus: c.leadStatus,
        purchaseProbability: c.purchaseProbability,
        technicalLevel: c.technicalLevel,
        totalInteractions: c.totalInteractions,
        lastInteraction: c.lastInteraction?.toISOString(),
        createdAt: c.createdAt.toISOString(),
      })),
      total: Number(total.count),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting clients");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/clients", async (req, res) => {
  try {
    const { phone, name, email } = req.body;
    const [client] = await db.insert(clientsTable).values({ phone, name, email }).returning();
    res.status(201).json({
      ...client,
      id: String(client.id),
      createdAt: client.createdAt.toISOString(),
      lastInteraction: client.lastInteraction?.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/clients/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const client = await db.query.clientsTable.findFirst({ where: eq(clientsTable.id, id) });
    if (!client) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...client, id: String(client.id), createdAt: client.createdAt.toISOString(), lastInteraction: client.lastInteraction?.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error getting client");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/clients/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, leadStatus, purchaseProbability, technicalLevel } = req.body;
    const [client] = await db.update(clientsTable)
      .set({ name, email, leadStatus, purchaseProbability, technicalLevel })
      .where(eq(clientsTable.id, id))
      .returning();
    res.json({ ...client, id: String(client.id), createdAt: client.createdAt.toISOString(), lastInteraction: client.lastInteraction?.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Error updating client");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
