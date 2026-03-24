import { handleMessage } from "./artifacts/api-server/src/core/router.js";

/**
 * Test script to verify consistent product search behavior
 * Tests for "Mega Pack Piano" - reproduces and validates the fix
 */

async function runTests() {
  console.log("🧪 INICIANDO PRUEBAS DE CONSISTENCIA DE BÚSQUEDA\n");
  console.log("=".repeat(60));

  const testCases = [
    {
      name: "Búsqueda 1: 'Mega pack completo de piano'",
      phone: "test_001",
      message: "Me interesa el mega pack completo de piano 🎹",
    },
    {
      name: "Búsqueda 2: Igual al anterior (debe ser consistente)",
      phone: "test_001",
      message: "Me interesa el mega pack completo de piano 🎹",
    },
    {
      name: "Búsqueda 3: 'Piano'",
      phone: "test_002",
      message: "Quiero un piano",
    },
    {
      name: "Búsqueda 4: 'Mega pack piano'",
      phone: "test_003",
      message: "Mega pack piano",
    },
    {
      name: "Búsqueda 5: 'Pack piano completo'",
      phone: "test_004",
      message: "Pack piano completo",
    },
    {
      name: "Búsqueda 6: Same as first (consistency check)",
      phone: "test_001",
      message: "Me interesa el mega pack completo de piano 🎹",
    },
  ];

  let passed = 0;
  let failed = 0;
  const results: Array<{
    name: string;
    hasProduct: boolean;
    response: string;
  }> = [];

  for (const testCase of testCases) {
    console.log(`\n✓ ${testCase.name}`);
    console.log(`  Mensaje: "${testCase.message}"`);

    try {
      const result = await handleMessage(
        testCase.phone,
        testCase.message,
        "Test User",
      );

      // Check if response mentions piano or related products
      const responseText = result.response.toLowerCase();
      const hasPiano =
        responseText.includes("piano") ||
        responseText.includes("pack") ||
        responseText.includes("mega");

      results.push({
        name: testCase.name,
        hasProduct: hasPiano,
        response: result.response,
      });

      if (hasPiano) {
        console.log("  ✅ ENCONTRÓ PRODUCTO");
        console.log(`  Respuesta: ${result.response.substring(0, 150)}...`);
        passed++;
      } else {
        console.log("  ❌ NO ENCONTRÓ PRODUCTO");
        console.log(`  Respuesta: ${result.response.substring(0, 150)}...`);
        failed++;
      }

      console.log(`  Intent: ${result.intent} | Agent: ${result.agent}`);
      console.log(`  Tiempo procesamiento: ${result.processingTime}ms`);
    } catch (err) {
      console.log(`  ❌ ERROR: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n📊 RESUMEN DE RESULTADOS\n");
  console.log(`  ✅ Éxito: ${passed}/${testCases.length}`);
  console.log(`  ❌ Fallos: ${failed}/${testCases.length}`);

  // Check consistency
  const firstResponse = results[0]?.hasProduct;
  const secondResponse = results[1]?.hasProduct;
  const sixthResponse = results[5]?.hasProduct;

  if (firstResponse === secondResponse && firstResponse === sixthResponse) {
    console.log("\n✨ CONSISTENCIA VERIFICADA: Todas las búsquedas iguales");
    console.log("   retornan resultados consistentes");
  } else {
    console.log("\n⚠️  INCONSISTENCIA DETECTADA:");
    console.log(
      `   Primera búsqueda: ${firstResponse ? "encontró" : "no encontró"}`,
    );
    console.log(
      `   Segunda búsqueda: ${secondResponse ? "encontró" : "no encontró"}`,
    );
    console.log(
      `   Sexta búsqueda: ${sixthResponse ? "encontró" : "no encontró"}`,
    );
  }

  console.log("\n" + "=".repeat(60));
}

// Run tests
runTests().catch(console.error);
