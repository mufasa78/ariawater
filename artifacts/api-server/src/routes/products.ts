import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  ListProductsResponse,
  CreateProductResponse,
  GetProductResponse,
  UpdateProductResponse,
  DeleteProductResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function mapProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    description: p.description ?? null,
    packSize: p.packSize,
    priceKes: Number(p.priceKes),
    stockQuantity: p.stockQuantity,
    imageUrl: p.imageUrl ?? null,
    isActive: p.isActive,
    category: p.category,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];

  // Public route — only show active products unless admin
  const isAdmin = req.session?.userRole === "admin";
  if (!isAdmin) {
    conditions.push(eq(productsTable.isActive, true));
  }

  if (params.data.category) {
    conditions.push(eq(productsTable.category, params.data.category));
  }

  if (params.data.inStock === "true") {
    // Filter to products that have stock available (quantity > 0)
    conditions.push(sql`${productsTable.stockQuantity} > 0`);
  }

  const products =
    conditions.length > 0
      ? await db
          .select()
          .from(productsTable)
          .where(and(...conditions))
      : await db.select().from(productsTable);

  res.json(ListProductsResponse.parse(products.map(mapProduct)));
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      ...parsed.data,
      priceKes: String(parsed.data.priceKes),
    })
    .returning();

  res.status(201).json(CreateProductResponse.parse(mapProduct(product)));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(mapProduct(product)));
});

router.patch("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { priceKes, ...rest } = parsed.data;
  const updateData: Partial<typeof productsTable.$inferInsert> = { ...rest };
  if (priceKes !== undefined) {
    updateData.priceKes = String(priceKes);
  }

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(UpdateProductResponse.parse(mapProduct(product)));
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(DeleteProductResponse.parse({ success: true }));
});

export default router;
