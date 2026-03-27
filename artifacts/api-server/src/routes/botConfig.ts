import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { botConfigTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function formatConfig(c: typeof botConfigTable.$inferSelect) {
  return {
    id: String(c.id),
    botName: c.botName,
    personality: c.personality,
    language: c.language,
    greetingMessage: c.greetingMessage,
    fallbackMessage: c.fallbackMessage,
    maxContextMessages: c.maxContextMessages,
    isActive: c.isActive,
    businessName: c.businessName,
    businessType: c.businessType,
    paymentMethods: c.paymentMethods.split(",").map((s) => s.trim()),
    workingHours: c.workingHours,
    // Datos de pago
    bankName: c.bankName,
    bankAccount: c.bankAccount,
    bankAccountType: c.bankAccountType,
    bankOwner: c.bankOwner,
    nequiNumber: c.nequiNumber,
    daviplataNumber: c.daviplataNumber,
    paypalEmail: c.paypalEmail,
    mercadoPagoLink: c.mercadoPagoLink,
  };
}

router.get("/bot-config", async (req, res) => {
  try {
    let config = await db.query.botConfigTable.findFirst();
    if (!config) {
      const [newConfig] = await db
        .insert(botConfigTable)
        .values({})
        .returning();
      config = newConfig;
    }
    res.json(formatConfig(config));
  } catch (err) {
    req.log.error({ err }, "Error getting bot config");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/bot-config", async (req, res) => {
  try {
    let config = await db.query.botConfigTable.findFirst();

    const updates: Partial<typeof botConfigTable.$inferInsert> = {};
    const fields = [
      "botName",
      "personality",
      "language",
      "greetingMessage",
      "fallbackMessage",
      "maxContextMessages",
      "isActive",
      "businessName",
      "businessType",
      "workingHours",
      "bankName",
      "bankAccount",
      "bankAccountType",
      "bankOwner",
      "nequiNumber",
      "daviplataNumber",
      "paypalEmail",
      "mercadoPagoLink",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        (updates as Record<string, unknown>)[field] = req.body[field];
      }
    }

    if (req.body.paymentMethods !== undefined) {
      updates.paymentMethods = Array.isArray(req.body.paymentMethods)
        ? req.body.paymentMethods.join(",")
        : req.body.paymentMethods;
    }

    updates.updatedAt = new Date();

    let result;
    if (config) {
      const [updated] = await db
        .update(botConfigTable)
        .set(updates)
        .where(eq(botConfigTable.id, config.id))
        .returning();
      result = updated;
    } else {
      const [created] = await db
        .insert(botConfigTable)
        .values(updates as typeof botConfigTable.$inferInsert)
        .returning();
      result = created;
    }

    res.json(formatConfig(result));
  } catch (err) {
    req.log.error({ err }, "Error updating bot config");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
