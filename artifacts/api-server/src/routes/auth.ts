import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { tenantsTable, authUsersTable, subscriptionsTable, invoicesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { PaymentService } from "../services/paymentService.js";
import { logger } from "../lib/logger.js";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-saas-key-2025";

// ─── PLANS ───────────────────────────────────────────────
const PLANS = {
  trial:   { priceCOP: 0,       priceUSD: 0,   days: 7,   label: "Prueba Gratuita 7 días" },
  monthly: { priceCOP: 30000,   priceUSD: 7.5, days: 30,  label: "Plan Mensual" },
  annual:  { priceCOP: 360000,  priceUSD: 90,  days: 365, label: "Plan Anual" },
};

// ─── REGISTER ─────────────────────────────────────────────
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, fullName, businessName, phone, city, country } = req.body;
    if (!email || !password || !fullName || !businessName) {
      res.status(400).json({ error: "Campos requeridos: email, password, fullName, businessName" }); return;
    }

    // Check existing user
    const existing = await db.query.authUsersTable.findFirst({ where: eq(authUsersTable.email, email) });
    if (existing) { res.status(409).json({ error: "El email ya está registrado" }); return; }

    // Create tenant with trial
    const slug = businessName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    const [tenant] = await db.insert(tenantsTable).values({
      name: businessName,
      slug: `${slug}-${Date.now()}`,
      plan: "trial",
      trialEndsAt: trialEnd,
    }).returning();

    // Hash password & create user
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(authUsersTable).values({
      tenantId: tenant.id,
      email,
      passwordHash,
      fullName,
      phone: phone || null,
      city: city || null,
      country: country || "Colombia",
    }).returning();

    // Create trial subscription
    const [sub] = await db.insert(subscriptionsTable).values({
      tenantId: tenant.id,
      plan: "trial",
      status: "active",
      priceCOP: 0,
      startsAt: new Date(),
      endsAt: trialEnd,
    }).returning();

    // Generate invoice for trial (free)
    const invoiceNumber = `INV-${Date.now()}`;
    await db.insert(invoicesTable).values({
      tenantId: tenant.id,
      subscriptionId: sub.id,
      invoiceNumber,
      clientName: fullName,
      clientEmail: email,
      clientPhone: phone || "",
      clientCity: city || "",
      clientCountry: country || "Colombia",
      description: "Prueba Gratuita 7 días - Bot de Ventas WhatsApp IA",
      plan: "trial",
      priceCOP: 0,
      tax: 0,
      total: 0,
      status: "paid",
      paidAt: new Date(),
    });

    const token = jwt.sign({ userId: user.id, tenantId: tenant.id, email }, JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({
      message: "¡Registro exitoso! Tu prueba gratuita de 7 días ha comenzado.",
      token,
      user: { id: user.id, email, fullName, tenantId: tenant.id, plan: "trial", trialEndsAt: trialEnd },
    });
  } catch (err) {
    logger.error({ err }, "Error en registro");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── LOGIN ────────────────────────────────────────────────
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: "Email y contraseña requeridos" }); return; }

    const user = await db.query.authUsersTable.findFirst({ where: eq(authUsersTable.email, email) });
    if (!user) { res.status(401).json({ error: "Credenciales inválidas" }); return; }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "Credenciales inválidas" }); return; }

    const tenant = await db.query.tenantsTable.findFirst({ where: eq(tenantsTable.id, user.tenantId!) });

    // Update last login
    await db.update(authUsersTable).set({ lastLogin: new Date() }).where(eq(authUsersTable.id, user.id));

    const token = jwt.sign({ userId: user.id, tenantId: user.tenantId, email }, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      token,
      user: { id: user.id, email, fullName: user.fullName, tenantId: user.tenantId, plan: tenant?.plan },
    });
  } catch (err) {
    logger.error({ err }, "Error en login");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── ME ───────────────────────────────────────────────────
authRouter.get("/me", requireAuth, async (req: any, res) => {
  try {
    const user = await db.query.authUsersTable.findFirst({ where: eq(authUsersTable.id, req.user.userId) });
    const tenant = await db.query.tenantsTable.findFirst({ where: eq(tenantsTable.id, req.user.tenantId) });
    const subscription = await db.query.subscriptionsTable.findFirst({
      where: eq(subscriptionsTable.tenantId, req.user.tenantId),
    });
    res.json({ user, tenant, subscription });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

// ─── SUBSCRIBE (Genera link de pago) ─────────────────────
authRouter.post("/subscribe", requireAuth, async (req: any, res) => {
  try {
    const { plan, paymentMethod } = req.body; // plan: monthly|annual, paymentMethod: mercadopago|paypal
    const planData = PLANS[plan as keyof typeof PLANS];
    if (!planData || plan === "trial") { res.status(400).json({ error: "Plan inválido" }); return; }

    let paymentLink: string | null = null;
    const description = `${planData.label} - Bot de Ventas WhatsApp IA`;

    if (paymentMethod === "mercadopago") {
      paymentLink = await PaymentService.createMercadoPagoLink(description, planData.priceCOP);
    } else if (paymentMethod === "paypal") {
      paymentLink = await PaymentService.createPayPalLink(description, planData.priceUSD);
    }

    if (!paymentLink) { res.status(500).json({ error: "No se pudo generar el link de pago" }); return; }

    // Create pending subscription
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + planData.days);

    const [sub] = await db.insert(subscriptionsTable).values({
      tenantId: req.user.tenantId,
      plan,
      status: "pending",
      priceCOP: planData.priceCOP,
      paymentMethod,
      paymentLink,
      startsAt: new Date(),
      endsAt,
    }).returning();

    res.json({ paymentLink, subscriptionId: sub.id, plan, amount: planData.priceCOP });
  } catch (err) {
    logger.error({ err }, "Error generando suscripción");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── CONFIRM PAYMENT (Activa suscripción y genera factura) ─
authRouter.post("/confirm-payment", requireAuth, async (req: any, res) => {
  try {
    const { subscriptionId, paymentId } = req.body;

    const sub = await db.query.subscriptionsTable.findFirst({
      where: eq(subscriptionsTable.id, subscriptionId),
    });
    if (!sub) { res.status(404).json({ error: "Suscripción no encontrada" }); return; }

    const planData = PLANS[sub.plan as keyof typeof PLANS];
    const user = await db.query.authUsersTable.findFirst({ where: eq(authUsersTable.tenantId, req.user.tenantId) });
    const tenant = await db.query.tenantsTable.findFirst({ where: eq(tenantsTable.id, req.user.tenantId) });

    // Activate subscription
    await db.update(subscriptionsTable).set({ status: "active", paymentId }).where(eq(subscriptionsTable.id, subscriptionId));

    // Update tenant plan
    await db.update(tenantsTable).set({ plan: sub.plan }).where(eq(tenantsTable.id, req.user.tenantId));

    // Generate invoice
    const invoiceNumber = `INV-${Date.now()}`;
    const tax = Math.round(sub.priceCOP * 0.19); // IVA 19% Colombia
    const total = sub.priceCOP + tax;

    const [invoice] = await db.insert(invoicesTable).values({
      tenantId: req.user.tenantId,
      subscriptionId,
      invoiceNumber,
      clientName: user?.fullName || "Cliente",
      clientEmail: user?.email || "",
      clientPhone: user?.phone || "",
      clientCity: user?.city || "",
      clientCountry: user?.country || "Colombia",
      description: `${planData?.label} - Bot de Ventas WhatsApp IA`,
      plan: sub.plan,
      priceCOP: sub.priceCOP,
      tax,
      total,
      status: "paid",
      paidAt: new Date(),
    }).returning();

    res.json({ message: "¡Pago confirmado y suscripción activada!", invoice, invoiceNumber });
  } catch (err) {
    logger.error({ err }, "Error confirmando pago");
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── INVOICES LIST ────────────────────────────────────────
authRouter.get("/invoices", requireAuth, async (req: any, res) => {
  try {
    const invoices = await db.query.invoicesTable.findMany({
      where: eq(invoicesTable.tenantId, req.user.tenantId),
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

// ─── INVOICE HTML (Para impresión/descarga) ────────────────
authRouter.get("/invoices/:id/html", requireAuth, async (req: any, res) => {
  try {
    const invoice = await db.query.invoicesTable.findFirst({
      where: eq(invoicesTable.id, parseInt(req.params.id)),
    });
    if (!invoice) { res.status(404).json({ error: "Factura no encontrada" }); return; }

    const html = generateInvoiceHTML(invoice);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
});

// ─── MIDDLEWARE AUTH ──────────────────────────────────────
export function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Token requerido" }); return; }
  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET) as any;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// ─── INVOICE HTML GENERATOR ──────────────────────────────
function generateInvoiceHTML(invoice: any) {
  const formatCOP = (v: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
  const formatDate = (d: Date) => new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Factura ${invoice.invoiceNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }
  .invoice-wrapper { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 40px 48px; display: flex; justify-content: space-between; align-items: flex-start; }
  .logo { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .logo span { opacity: 0.7; font-weight: 400; font-size: 14px; display: block; margin-top: 4px; }
  .invoice-title { text-align: right; }
  .invoice-title h2 { font-size: 28px; font-weight: 700; }
  .invoice-title p { opacity: 0.8; font-size: 14px; margin-top: 4px; }
  .body { padding: 48px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  .info-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 12px; }
  .info-block p { font-size: 14px; color: #334155; line-height: 1.7; }
  .info-block .name { font-size: 17px; font-weight: 600; color: #1e293b; }
  .table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  .table thead th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
  .table tbody td { padding: 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
  .table tbody tr:last-child td { border-bottom: none; }
  .totals { margin-left: auto; width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #475569; border-bottom: 1px solid #f1f5f9; }
  .total-final { display: flex; justify-content: space-between; padding: 14px 0; font-size: 18px; font-weight: 700; color: #1e293b; }
  .badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; }
  .footer { background: #f8fafc; padding: 24px 48px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  @media print { body { background: white; padding: 0; } .invoice-wrapper { box-shadow: none; } }
</style>
</head>
<body>
<div class="invoice-wrapper">
  <div class="header">
    <div class="logo">🤖 BotVentas IA<span>La plataforma de ventas con WhatsApp</span></div>
    <div class="invoice-title">
      <h2>FACTURA</h2>
      <p>${invoice.invoiceNumber}</p>
      <div class="badge" style="margin-top:8px; background:rgba(255,255,255,0.2); color:white;">${invoice.status === "paid" ? "✅ PAGADO" : "⏳ PENDIENTE"}</div>
    </div>
  </div>
  <div class="body">
    <div class="info-grid">
      <div class="info-block">
        <h4>Facturado a</h4>
        <p class="name">${invoice.clientName}</p>
        <p>${invoice.clientEmail}</p>
        ${invoice.clientPhone ? `<p>${invoice.clientPhone}</p>` : ""}
        ${invoice.clientCity ? `<p>${invoice.clientCity}, ${invoice.clientCountry}</p>` : ""}
      </div>
      <div class="info-block">
        <h4>Detalles de Factura</h4>
        <p><strong>N° Factura:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Emitida:</strong> ${formatDate(invoice.issuedAt)}</p>
        ${invoice.paidAt ? `<p><strong>Pagada:</strong> ${formatDate(invoice.paidAt)}</p>` : ""}
        <p><strong>Plan:</strong> ${invoice.plan.toUpperCase()}</p>
      </div>
    </div>
    <table class="table">
      <thead><tr><th>Descripción</th><th>Plan</th><th style="text-align:right">Valor</th></tr></thead>
      <tbody>
        <tr>
          <td>${invoice.description}</td>
          <td>${invoice.plan.charAt(0).toUpperCase() + invoice.plan.slice(1)}</td>
          <td style="text-align:right">${formatCOP(invoice.priceCOP)}</td>
        </tr>
      </tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${formatCOP(invoice.priceCOP)}</span></div>
      <div class="total-row"><span>IVA (19%)</span><span>${formatCOP(invoice.tax)}</span></div>
      <div class="total-final"><span>TOTAL</span><span>${formatCOP(invoice.total)}</span></div>
    </div>
  </div>
  <div class="footer">
    Gracias por confiar en BotVentas IA 🚀 • Soporte: soporte@botventas.app • Esta factura fue generada automáticamente.
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;
}
