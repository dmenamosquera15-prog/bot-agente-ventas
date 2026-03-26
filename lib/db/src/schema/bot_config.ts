import {
  pgTable,
  text,
  serial,
  timestamp,
  boolean,
  integer,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const botConfigTable = pgTable("bot_config", {
  id: serial("id").primaryKey(),
  botName: text("bot_name").notNull().default("Bot Inteligente"),
  personality: text("personality")
    .notNull()
    .default(
      "Soy un asistente de ventas inteligente, amable y profesional. Ayudo a los clientes a encontrar los mejores productos y soluciones para sus necesidades.",
    ),
  language: varchar("language", { length: 10 }).notNull().default("es"),
  greetingMessage: text("greeting_message")
    .notNull()
    .default(
      "¡Hola! 👋 Soy Bot Inteligente, tu asistente virtual. ¿En qué puedo ayudarte hoy?",
    ),
  fallbackMessage: text("fallback_message")
    .notNull()
    .default(
      "Lo siento, no entendí bien tu mensaje. ¿Puedes reformularlo? Puedo ayudarte con productos, precios, soporte técnico y más.",
    ),
  maxContextMessages: integer("max_context_messages").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  businessName: text("business_name").notNull().default("Mi Tienda"),
  businessType: text("business_type").notNull().default("Tienda de tecnología"),
  paymentMethods: text("payment_methods")
    .notNull()
    .default("Efectivo,Transferencia,Tarjeta de crédito"),
  workingHours: text("working_hours")
    .notNull()
    .default("Lunes a Viernes 8am-6pm, Sábados 9am-2pm"),

  // Datos de pago configurables para SaaS
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  bankAccountType: text("bank_account_type"), // Ahorros/Corriente
  bankOwner: text("bank_owner"),
  nequiNumber: text("nequi_number"),
  daviplataNumber: text("daviplata_number"),
  paypalEmail: text("paypal_email"),
  mercadoPagoLink: text("mercado_pago_link"),
  
  // WooCommerce Sync
  wooCommerceUrl: text("woo_commerce_url"),
  wooCommerceConsumerKey: text("woo_commerce_consumer_key"),
  wooCommerceConsumerSecret: text("woo_commerce_consumer_secret"),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBotConfigSchema = createInsertSchema(botConfigTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type BotConfig = typeof botConfigTable.$inferSelect;
