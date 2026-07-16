import { Router } from "express";
import { convex, api } from "../lib/convex-client";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import {
  ListProductsQueryParams,
  GetProductParams,
  DeleteProductParams,
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  ListProductsResponse,
  GetProductResponse,
  CreateProductResponse,
  UpdateProductResponse,
} from "@workspace/api-zod";

const router: Router = Router();

function mapProduct(p: Record<string, unknown>) {
  return {
    id: p._id,
    name: p.name,
    sku: p.sku,
    description: p.description ?? null,
    packSize: p.packSize,
    priceKes: p.priceKes,
    stockQuantity: p.stockQuantity,
    imageUrl: p.imageUrl ?? null,
    isActive: p.isActive,
    category: p.category ?? null,
    createdAt: new Date(p._creationTime as number).toISOString(),
  };
}

// GET /api/products
router.get("/", async (req, res) => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { category, inStock } = params.data;

  const products = await convex.query(api.products.list, {
    category: category ?? undefined,
    inStock: inStock === "true" ? true : undefined,
  }) as Record<string, unknown>[];

  res.json(ListProductsResponse.parse(products.map(mapProduct)));
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const product = await convex.query(api.products.get, {
    id: params.data.id,
  }) as Record<string, unknown> | null;

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(mapProduct(product)));
});

// POST /api/products — admin only
router.post("/", requireAdmin, async (req, res) => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, sku, description, packSize, priceKes, stockQuantity, imageUrl, isActive, category } = parsed.data;

  let product: Record<string, unknown> | null;
  try {
    product = await convex.mutation(api.products.create, {
      name,
      sku,
      description: description ?? undefined,
      packSize,
      priceKes,
      stockQuantity,
      imageUrl: imageUrl ?? undefined,
      isActive: isActive ?? true,
      category: category ?? undefined,
    }) as Record<string, unknown> | null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) {
      res.status(409).json({ error: msg });
      return;
    }
    throw err;
  }

  res.status(201).json(CreateProductResponse.parse(mapProduct(product!)));
});

// PATCH /api/products/:id — admin only
router.patch("/:id", requireAdmin, async (req, res) => {
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

  let product: Record<string, unknown> | null;
  try {
    product = await convex.mutation(api.products.update, {
      id: params.data.id,
      ...parsed.data,
    }) as Record<string, unknown> | null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("not found")) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    throw err;
  }

  res.json(UpdateProductResponse.parse(mapProduct(product!)));
});

// DELETE /api/products/:id — admin only
router.delete("/:id", requireAdmin, async (req, res) => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    await convex.mutation(api.products.remove, { id: params.data.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("not found")) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    throw err;
  }

  res.status(204).send();
});

export default router;
