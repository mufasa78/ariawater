import { Router } from "express";
import { clerkClient } from "@clerk/express";
import { requireAdmin } from "../middlewares/auth.js";
import type { Role } from "../middlewares/auth.js";

const router: Router = Router();

const VALID_ROLES: Role[] = ["admin", "marketing", "sales", "accounting", "customer"];

// GET /api/admin/users — list all Clerk users with their roles
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const { data: users } = await clerkClient.users.getUserList({ limit: 100 });

    const list = users.map((u) => ({
      id: u.id,
      name:
        u.firstName && u.lastName
          ? `${u.firstName} ${u.lastName}`
          : u.username || u.emailAddresses[0]?.emailAddress || u.id,
      email: u.emailAddresses[0]?.emailAddress || "",
      role: (u.publicMetadata.role as Role) || "customer",
      approved: u.publicMetadata.approved !== false,
      createdAt: u.createdAt,
    }));

    res.json({ users: list });
  } catch (err) {
    console.error("Error listing users:", err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// PATCH /api/admin/users/:userId/role — update a user's role
router.patch("/:userId/role", requireAdmin, async (req, res) => {
  const userId = req.params.userId as string;
  const { role } = req.body as { role?: string };

  if (!role || !VALID_ROLES.includes(role as Role)) {
    res.status(400).json({
      error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
    });
    return;
  }

  // Prevent an admin from demoting themselves
  if (userId === req.user?.userId && role !== "admin") {
    res.status(400).json({ error: "You cannot change your own role" });
    return;
  }

  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role, approved: true },
    });
    res.json({ success: true, userId, role });
  } catch (err) {
    console.error("Error updating user role:", err);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

// PATCH /api/admin/users/:userId/approve — toggle approved flag
router.patch("/:userId/approve", requireAdmin, async (req, res) => {
  const userId = req.params.userId as string;
  const { approved } = req.body as { approved?: boolean };

  if (typeof approved !== "boolean") {
    res.status(400).json({ error: "approved must be a boolean" });
    return;
  }

  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { approved },
    });
    res.json({ success: true, userId, approved });
  } catch (err) {
    console.error("Error updating user approval:", err);
    res.status(500).json({ error: "Failed to update user approval" });
  }
});

export default router;
