import { generateResponse } from "../services/aiService.js";

export const HANDLED_INTENTS = ["facturacion", "ubicacion", "horario"];

export async function handle(
  clientName: string | null,
  intentData: { intent: string; entities: Record<string, string> },
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  botConfig: { businessName: string; botName: string; workingHours: string; paymentMethods: string }
): Promise<string> {
  const { intent } = intentData;

  const systemPrompt = `Eres ${botConfig.botName}, el agente administrativo de ${botConfig.businessName}.

Tu rol: Gestión de facturación, información de ubicación y horarios de atención.
Intención: ${intent}
${clientName ? `Cliente: ${clientName}` : ""}
Horario de atención: ${botConfig.workingHours}
Métodos de pago: ${botConfig.paymentMethods}

INSTRUCCIONES:
- Responde en español de manera clara y eficiente
- Para facturación: explica el proceso de facturación y documentos necesarios
- Para ubicación: proporciona información del negocio
- Para horario: da el horario completo y días de atención
- Sé conciso y preciso
- Máximo 2 párrafos`;

  return await generateResponse(systemPrompt, "", message, history);
}
