import fetch from "node-fetch";
import { logger } from "../lib/logger.js";

export interface PaymentLinkResult {
  url: string;
  provider: "mercadopago" | "paypal";
}

export class PaymentService {
  /**
   * Genera un link de pago dinámico en Mercado Pago (Colombia)
   */
  static async createMercadoPagoLink(
    title: string,
    price: number,
    quantity: number = 1
  ): Promise<string | null> {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      logger.error("MERCADO_PAGO_ACCESS_TOKEN not set");
      return null;
    }

    try {
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              title,
              unit_price: price,
              quantity,
              currency_id: "COP", // Predeterminado para Colombia
            },
          ],
          back_urls: {
            success: "https://www.tusitio.com/pago-exitoso",
            failure: "https://www.tusitio.com/pago-fallido",
            pending: "https://www.tusitio.com/pago-pendiente",
          },
          auto_return: "approved",
        }),
      });

      const data: any = await response.json();
      return data.init_point || data.sandbox_init_point || null;
    } catch (err) {
      logger.error({ err }, "Error creating Mercado Pago link");
      return null;
    }
  }

  /**
   * Genera un link de pago dinámico en PayPal
   */
  static async createPayPalLink(
    title: string,
    price: number
  ): Promise<string | null> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || "sandbox";

    if (!clientId || !clientSecret) {
      logger.error("PayPal credentials not set");
      return null;
    }

    const authBase64 = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const baseUrl = mode === "live" 
      ? "https://api-m.paypal.com" 
      : "https://api-m.sandbox.paypal.com";

    try {
      // 1. Get Access Token
      const authRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authBase64}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      const authData: any = await authRes.json();
      const accessToken = authData.access_token;

      // 2. Create Order
      const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              description: title,
              amount: {
                currency_code: "USD",
                value: price.toString(),
              },
            },
          ],
        }),
      });

      const orderData: any = await orderRes.json();
      const approveLink = orderData.links?.find((l: any) => l.rel === "approve");
      return approveLink?.href || null;
    } catch (err) {
      logger.error({ err }, "Error creating PayPal link");
      return null;
    }
  }
}
