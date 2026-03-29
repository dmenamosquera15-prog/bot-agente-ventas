import { generateResponse, classifyIntent } from "../artifacts/api-server/src/services/aiService.js";
import { logger } from "../artifacts/api-server/src/lib/logger.js";

async function runTests() {
  console.log("🚀 Iniciando Pruebas de Failover...");
  
  try {
    console.log("\n--- Prueba 1: Clasificación de Intención ---");
    const intent = await classifyIntent("Hola, ¿cuánto cuesta el producto?");
    console.log("✅ Resultado Intención:", JSON.stringify(intent, null, 2));

    console.log("\n--- Prueba 2: Generación de Respuesta (con failover si Ollama falla) ---");
    const response = await generateResponse(
      "Eres un asistente de ventas amable.",
      "Tenemos productos de tecnología.",
      "Hola, me interesa comprar algo",
      []
    );
    console.log("✅ Respuesta final del Bot:", response);

  } catch (err: any) {
    console.error("❌ Falla crítica en las pruebas:", err.message);
  }
}

runTests();
