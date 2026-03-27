import { Router, type IRouter } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function parseProducts(rows: Record<string, unknown>[]) {
  return rows
    .filter((r) => r.name || r.Name || r.nombre || r.Nombre)
    .map((r) => ({
      name: String(r.name || r.Name || r.nombre || r.Nombre || ""),
      description:
        String(
          r.description ||
            r.Description ||
            r.descripcion ||
            r.Descripcion ||
            "",
        ) || undefined,
      price: parseFloat(
        String(r.price || r.Price || r.precio || r.Precio || "0"),
      ),
      category: String(
        r.category || r.Category || r.categoria || r.Categoria || "General",
      ),
      brand:
        String(r.brand || r.Brand || r.marca || r.Marca || "") || undefined,
      stock:
        parseInt(String(r.stock || r.Stock || r.existencia || "0"), 10) || 0,
      imageUrl:
        String(
          r.imageUrl || r.image_url || r.imagen || r.image || r.foto || "",
        ) || undefined,
      isActive: true,
    }))
    .filter((p) => p.name && !isNaN(p.price) && p.price >= 0);
}

router.post(
  "/products/import/excel",
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "No se recibió ningún archivo" });
      return;
    }
    try {
      let rows: Record<string, unknown>[] = [];
      const fileName = req.file.originalname?.toLowerCase() || "";
      const isCsv =
        fileName.endsWith(".csv") ||
        req.file.mimetype === "text/csv" ||
        req.file.mimetype === "text/plain";

      if (isCsv) {
        // Parse CSV manually — handles BOM, semicolons, and quoted fields
        let text = req.file.buffer.toString("utf-8").replace(/^\uFEFF/, ""); // strip BOM
        const delimiter =
          text.indexOf(";") > 0 && text.indexOf(",") < 0 ? ";" : ",";
        const lines = text
          .split(/\r?\n/)
          .filter(
            (l) => l.trim() && l.trim() !== ",".repeat(l.split(",").length - 1),
          );
        if (lines.length < 2) {
          res.status(400).json({ error: "El CSV está vacío o no tiene datos" });
          return;
        }
        const headers = lines[0]
          .split(delimiter)
          .map((h) => h.trim().replace(/^"|"$/g, ""));
        rows = lines
          .slice(1)
          .filter((l) => l.trim())
          .map((line) => {
            const vals = line
              .split(delimiter)
              .map((v) => v.trim().replace(/^"|"$/g, ""));
            return Object.fromEntries(
              headers.map((h, i) => [h, vals[i] ?? ""]),
            );
          });
      } else {
        // Parse Excel with XLSX library
        const wb = XLSX.read(req.file.buffer, {
          type: "buffer",
          cellDates: true,
        });
        if (!wb.SheetNames.length) {
          res.status(400).json({ error: "El archivo Excel no tiene hojas" });
          return;
        }
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<
          string,
          unknown
        >[];
      }

      const products = parseProducts(rows);

      if (!products.length) {
        const sample = rows[0]
          ? Object.keys(rows[0]).join(", ")
          : "sin columnas";
        res.status(400).json({
          error: `No se encontraron productos válidos. Columnas detectadas: [${sample}]. Columnas requeridas: name/nombre, price/precio, category/categoria`,
        });
        return;
      }

      const inserted = await db
        .insert(productsTable)
        .values(products)
        .returning();
      res.json({
        success: true,
        imported: inserted.length,
        total: rows.length,
      });
    } catch (err: any) {
      console.error("Excel/CSV import error:", err);
      res
        .status(500)
        .json({ error: `Error procesando archivo: ${err.message}` });
    }
  },
);

router.post("/products/import/json", async (req, res) => {
  const { products: rawProducts } = req.body;
  if (!Array.isArray(rawProducts) || !rawProducts.length) {
    res.status(400).json({
      error:
        "Se esperaba un objeto { products: [...] } con al menos un producto",
    });
    return;
  }
  try {
    const products = parseProducts(rawProducts);
    if (!products.length) {
      res.status(400).json({
        error:
          "Ningún producto tiene los campos requeridos: name/nombre, price/precio, category/categoria",
      });
      return;
    }
    const inserted = await db
      .insert(productsTable)
      .values(products)
      .returning();
    res.json({ success: true, imported: inserted.length });
  } catch (err: any) {
    console.error("JSON import error:", err);
    res.status(500).json({ error: `Error procesando JSON: ${err.message}` });
  }
});

router.post("/products/import/woocommerce", async (req, res) => {
  const { url, consumerKey, consumerSecret, perPage = 100 } = req.body;
  if (!url || !consumerKey || !consumerSecret) {
    res
      .status(400)
      .json({ error: "url, consumerKey y consumerSecret son requeridos" });
    return;
  }
  try {
    const base = url.replace(/\/$/, "");
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      "base64",
    );
    const apiUrl = `${base}/wp-json/wc/v3/products?per_page=${perPage}&status=publish`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      res.status(400).json({
        error: `WooCommerce respondió con error ${response.status}: ${errText.substring(0, 300)}`,
      });
      return;
    }

    const wcProducts = (await response.json()) as Record<string, unknown>[];

    if (!Array.isArray(wcProducts)) {
      res.status(400).json({
        error:
          "La respuesta de WooCommerce no es un array. Verifica la URL y las credenciales.",
      });
      return;
    }

    const products = wcProducts
      .map((p: Record<string, unknown>) => ({
        name: String(p.name || ""),
        description:
          String(
            ((p.short_description as string) || (p.description as string) || "")
              .replace(/<[^>]+>/g, "")
              .substring(0, 500),
          ) || undefined,
        price: parseFloat(String(p.price || p.regular_price || "0")),
        category: (p.categories as { name: string }[])?.[0]?.name || "General",
        brand:
          String(
            (p.attributes as { name: string; options: string[] }[])?.find(
              (a) =>
                a.name.toLowerCase().includes("marca") ||
                a.name.toLowerCase().includes("brand"),
            )?.options?.[0] || "",
          ) || undefined,
        stock: parseInt(String(p.stock_quantity || "0"), 10) || 0,
        imageUrl: (p.images as { src: string }[])?.[0]?.src || undefined,
        wooCommerceId: Number(p.id),
        isActive: true,
      }))
      .filter((p) => p.name && !isNaN(p.price));

    if (!products.length) {
      res.status(400).json({
        error: `WooCommerce devolvió ${wcProducts.length} productos pero ninguno tiene nombre y precio válidos`,
      });
      return;
    }

    const inserted = await db
      .insert(productsTable)
      .values(products)
      .returning();
    res.json({
      success: true,
      imported: inserted.length,
      total: wcProducts.length,
    });
  } catch (err: any) {
    console.error("WooCommerce import error:", err);
    res
      .status(500)
      .json({ error: `Error conectando con WooCommerce: ${err.message}` });
  }
});

export default router;
