import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { eq, ilike, count, desc, or } from "drizzle-orm";

const router: IRouter = Router();

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: String(p.id),
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    brand: p.brand,
    stock: p.stock,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res) => {
  try {
    const { category, search, limit = "50", offset = "0" } = req.query as Record<string, string>;
    
    let baseQuery = db.select().from(productsTable);
    
    if (category) baseQuery = baseQuery.where(ilike(productsTable.category, `%${category}%`)) as typeof baseQuery;
    if (search) baseQuery = baseQuery.where(or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.brand || productsTable.name, `%${search}%`))) as typeof baseQuery;
    
    const [total] = await db.select({ count: count() }).from(productsTable);
    const data = await baseQuery.orderBy(desc(productsTable.createdAt)).limit(Number(limit)).offset(Number(offset));
    
    res.json({ data: data.map(formatProduct), total: Number(total.count) });
  } catch (err) {
    req.log.error({ err }, "Error getting products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const { name, description, price, category, brand, stock, imageUrl } = req.body;
    const [product] = await db.insert(productsTable).values({ name, description, price, category, brand, stock, imageUrl }).returning();
    res.status(201).json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Error creating product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, price, category, brand, stock, imageUrl, isActive } = req.body;
    const [product] = await db.update(productsTable)
      .set({ name, description, price, category, brand, stock, imageUrl, isActive })
      .where(eq(productsTable.id, id))
      .returning();
    res.json(formatProduct(product));
  } catch (err) {
    req.log.error({ err }, "Error updating product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.update(productsTable).set({ isActive: false }).where(eq(productsTable.id, id));
    res.json({ success: true, message: "Product deactivated" });
  } catch (err) {
    req.log.error({ err }, "Error deleting product");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
