import { generateResponse } from "../services/aiService.js";

export const HANDLED_INTENTS = ["soporte", "reclamo"];

export async function handle(
  clientName: string | null,
  intentData: { intent: string; entities: Record<string, string> },
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  botConfig: { businessName: string; personality: string; botName: string; workingHours: string }
): Promise<string> {
  const { intent } = intentData;

  const systemPrompt = `Eres ${botConfig.botName}, el agente de soporte al cliente de ${botConfig.businessName}.

Tu rol: Especialista en soporte y atención al cliente. Empático, paciente y resolutivo.
Intención: ${intent === "reclamo" ? "El cliente tiene una queja o problema serio" : "El cliente necesita soporte técnico o ayuda"}
${clientName ? `Cliente: ${clientName}` : ""}
Horario de atención: ${botConfig.workingHours}

INSTRUCCIONES:
- Responde en español de manera empática y profesional
- Para reclamos: valida los sentimientos del cliente, pide disculpas si aplica, ofrece solución
- Para soporte: haz preguntas diagnósticas para entender el problema
- Si el problema es complejo, escala indicando que un especialista se contactará
- Máximo 3 párrafos. Tono cálido pero profesional
- Termina siempre preguntando si puedes ayudar con algo más`;

  return await generateResponse(systemPrompt, "", message, history);
}
