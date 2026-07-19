import { Router } from "express";
import multer from "multer";
import { convex, api } from "../lib/convex-client.js";
import { requireAdmin } from "../middlewares/auth.js";

const router: Router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

/**
 * POST /api/uploads/image
 * Admin-only. Accepts multipart/form-data with field name "image".
 * Uploads to Convex storage and returns the public CDN URL.
 */
router.post("/image", requireAdmin, upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  // 1. Get a one-time upload URL from Convex
  const uploadUrl = (await convex.mutation(api.files.generateUploadUrl, {})) as string;

  // 2. Upload the file buffer to Convex storage
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": req.file.mimetype },
    body: req.file.buffer,
  });

  if (!uploadRes.ok) {
    const body = await uploadRes.text();
    console.error("Convex storage upload failed:", body);
    res.status(502).json({ error: "Failed to upload to storage" });
    return;
  }

  const { storageId } = (await uploadRes.json()) as { storageId: string };

  // 3. Resolve to a public CDN URL
  const imageUrl = (await convex.query(api.files.getStorageUrl, { storageId })) as string;

  res.json({ imageUrl, storageId });
});

export default router;
