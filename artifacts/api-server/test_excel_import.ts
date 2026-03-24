// Test Excel/CSV upload via multipart form
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testExcelImport() {
  const BASE = 'http://localhost:5000/api';

  // Create a minimal CSV file buffer
  const csvContent = `name,description,price,category,brand,stock,imageUrl
Laptop HP,Intel i5 16GB RAM,899.99,Laptops,HP,10,https://via.placeholder.com/300
Mouse Logitech,Mouse inalámbrico,29.99,Periféricos,Logitech,50,`;

  const FormData = (await import('node:buffer')).Blob;
  
  console.log("=== Testing Excel/CSV Import ===");
  try {
    // Use fetch with FormData-like approach
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.csv"\r\nContent-Type: text/csv\r\n\r\n`),
      csvBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const r = await fetch(`${BASE}/products/import/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body
    });
    const text = await r.text();
    console.log("Status:", r.status);
    console.log("Response:", text);
  } catch (e: any) {
    console.error("Fetch error:", e.message);
  }
}

testExcelImport().then(() => process.exit(0));
