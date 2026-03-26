import { logger } from "../lib/logger.js";

export interface OrderData {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  phone: string;
  line_items: Array<{
    product_id?: number;
    name?: string;
    quantity: number;
    price?: number;
  }>;
}

export class WooCommerceService {
  static async createOrder(config: { url: string; ck: string; cs: string }, order: OrderData): Promise<any> {
    if (!config.url || !config.ck || !config.cs) {
      logger.warn("WooCommerce config missing, skipping order creation");
      return null;
    }

    try {
      const auth = Buffer.from(`${config.ck}:${config.cs}`).toString("base64");
      const url = `${config.url.replace(/\/$/, "")}/wp-json/wc/v3/orders`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },
        body: JSON.stringify({
          payment_method: "cod",
          payment_method_title: "Pago Contra Entrega / WhatsApp",
          set_paid: false,
          billing: {
            first_name: order.first_name,
            last_name: order.last_name,
            address_1: order.address_1,
            city: order.city,
            phone: order.phone,
            country: "CO"
          },
          shipping: {
            first_name: order.first_name,
            last_name: order.last_name,
            address_1: order.address_1,
            city: order.city,
            country: "CO"
          },
          line_items: order.line_items,
          customer_note: "Pedido automático via Bot WhatsApp IA"
        })
      });

      if (!response.ok) {
        const err = await response.json() as any;
        logger.error({ err }, "WooCommerce API error");
        return null;
      }

      const data = await response.json() as any;
      logger.info({ orderId: data.id }, "WooCommerce order created successfully");
      return data;
    } catch (err) {
      logger.error({ err }, "Failed to create WooCommerce order");
      return null;
    }
  }
}
