import { Router } from "express";
import { convex, api } from "../lib/convex-client.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
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
    category: (p.category as string) ?? "general",
    createdAt: new Date(p._creationTime as number).toISOString(),
    vatClass: (p.vatClass as string | undefined) ?? "standard",
    kraItemCode: (p.kraItemCode as string | undefined) ?? null,
    uom: (p.uom as string | undefined) ?? "piece",
  };
}

// GET /api/products
router.get("/", async (req, res) => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { category } = params.data;
  const inStock = req.query.inStock === "true";

  const products = await convex.query(api.products.list, {
    category: category ?? undefined,
    inStock: inStock ? true : undefined,
    activeOnly: inStock ? true : undefined,
  }) as Record<string, unknown>[];
  try {
    const params = ListProductsQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const { category, inStock } = params.data;

    req.log?.info?.({ category, inStock }, "Fetching products");

    // Add timeout to Convex query
    const products = await Promise.race([
      convex.query(api.products.list, {
        category: category ?? undefined,
        inStock: inStock === "true" ? true : undefined,
      }) as Promise<Record<string, unknown>[]>,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Convex query timeout")), 10000)
      ),
    ]);

    req.log?.info?.({ count: products.length }, "Products fetched successfully");

    res.json(ListProductsResponse.parse(products.map(mapProduct)));
  } catch (error) {
    req.log?.error?.({ err: error }, "Failed to fetch products");
    
    if (error instanceof Error && error.message === "Convex query timeout") {
      res.status(504).json({ error: "Database query timeout" });
      return;
    }
    
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const product = await convex.query(api.products.get, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: params.data.id as any,
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

  const { name, sku, description, packSize, priceKes, stockQuantity, imageUrl, isActive, category, vatClass, kraItemCode, uom } = parsed.data;

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
      vatClass: (vatClass as "standard" | "zero" | "exempt") ?? "standard",
      kraItemCode: kraItemCode ?? undefined,
      uom: uom ?? "piece",
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

  // Convert null → undefined for optional Convex fields; cast id to branded type
  const { vatClass, kraItemCode, imageUrl: imgUrl, description: desc, ...rest } = parsed.data;
  const updatePayload = {
    ...rest,
    description: desc ?? undefined,
    imageUrl: imgUrl ?? undefined,
    vatClass: vatClass as "standard" | "zero" | "exempt" | undefined,
    kraItemCode: kraItemCode ?? undefined,
  };

  let product: Record<string, unknown> | null;
  try {
    product = await convex.mutation(api.products.update, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: params.data.id as any,
      ...updatePayload,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await convex.mutation(api.products.remove, { id: params.data.id as any });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("not found")) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    throw err;
  }

  res.status(200).json({ success: true });
});

export default router;
