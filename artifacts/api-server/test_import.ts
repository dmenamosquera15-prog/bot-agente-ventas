// Test the import endpoints via direct fetch
async function testImports() {
  const BASE = 'http://localhost:5000/api';

  // Test JSON import
  console.log("=== Testing JSON Import ===");
  try {
    const r = await fetch(`${BASE}/products/import/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: [
          {
            name: 'Producto de Prueba Import',
            description: 'Descripción de prueba',
            price: 49.99,
            category: 'Electrónica',
            brand: 'Samsung',
            stock: 5,
            imageUrl: 'https://via.placeholder.com/300'
          }
        ]
      })
    });
    const text = await r.text();
    console.log("Status:", r.status);
    console.log("Response:", text);
  } catch (e: any) {
    console.error("Fetch error:", e.message);
  }
}

testImports().then(() => process.exit(0));
