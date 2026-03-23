import { Router, type IRouter } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function parseProducts(rows: Record<string, unknown>[]) {
  return rows
    .filter(r => r.name || r.Name || r.nombre || r.Nombre)
    .map(r => ({
      name: String(r.name || r.Name || r.nombre || r.Nombre || ""),
      description: String(r.description || r.Description || r.descripcion || r.Descripcion || ""),
      price: parseFloat(String(r.price || r.Price || r.precio || r.Precio || "0")),
      category: String(r.category || r.Category || r.categoria || r.Categoria || "General"),
      brand: String(r.brand || r.Brand || r.marca || r.Marca || ""),
      stock: parseInt(String(r.stock || r.Stock || r.existencia || "0"), 10),
      imageUrl: String(r.imageUrl || r.image_url || r.imagen || r.image || r.foto || ""),
      isActive: true,
    }))
    .filter(p => p.name && p.price >= 0);
}

router.post("/products/import/excel", upload.single("file"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
    const products = parseProducts(rows);
    if (!products.length) { res.status(400).json({ error: "No valid products found in file" }); return; }
    const inserted = await db.insert(productsTable).values(products).returning();
    res.json({ success: true, imported: inserted.length, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Excel import error");
    res.status(500).json({ error: "Error processing file" });
  }
});

router.post("/products/import/json", async (req, res) => {
  const { products: rawProducts } = req.body;
  if (!Array.isArray(rawProducts) || !rawProducts.length) {
    res.status(400).json({ error: "Expected { products: [...] }" }); return;
  }
  try {
    const products = parseProducts(rawProducts);
    if (!products.length) { res.status(400).json({ error: "No valid products in JSON" }); return; }
    const inserted = await db.insert(productsTable).values(products).returning();
    res.json({ success: true, imported: inserted.length });
  } catch (err) {
    req.log.error({ err }, "JSON import error");
    res.status(500).json({ error: "Error processing JSON" });
  }
});

router.post("/products/import/woocommerce", async (req, res) => {
  const { url, consumerKey, consumerSecret, perPage = 100 } = req.body;
  if (!url || !consumerKey || !consumerSecret) {
    res.status(400).json({ error: "url, consumerKey, consumerSecret are required" }); return;
  }
  try {
    const base = url.replace(/\/$/, "");
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const response = await fetch(`${base}/wp-json/wc/v3/products?per_page=${perPage}&status=publish`, {
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    });
    if (!response.ok) {
      res.status(400).json({ error: `WooCommerce API error: ${response.status} ${response.statusText}` }); return;
    }
    const wcProducts = await response.json() as Record<string, unknown>[];
    const products = wcProducts.map((p: Record<string, unknown>) => ({
      name: String(p.name || ""),
      description: String(
        ((p.short_description as string) || (p.description as string) || "")
          .replace(/<[^>]+>/g, "").substring(0, 500)
      ),
      price: parseFloat(String(p.price || p.regular_price || "0")),
      category: ((p.categories as {name:string}[])?.[0]?.name) || "General",
      brand: String(((p.attributes as {name:string,options:string[]}[])?.find(a => a.name.toLowerCase().includes("marca") || a.name.toLowerCase().includes("brand"))?.options?.[0]) || ""),
      stock: parseInt(String(p.stock_quantity || "0"), 10),
      imageUrl: ((p.images as {src:string}[])?.[0]?.src) || "",
      isActive: true,
    })).filter(p => p.name && !isNaN(p.price));

    if (!products.length) { res.status(400).json({ error: "No valid products from WooCommerce" }); return; }
    const inserted = await db.insert(productsTable).values(products).returning();
    res.json({ success: true, imported: inserted.length, total: wcProducts.length });
  } catch (err) {
    req.log.error({ err }, "WooCommerce import error");
    res.status(500).json({ error: String(err) });
  }
});

export default router;
