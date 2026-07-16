import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { convex, api } from "../lib/convex-client";
import { requireAuth } from "../middlewares/auth";
import {
  RegisterBody,
  LoginBody,
  RegisterResponse,
  LoginResponse,
  GetMeResponse,
} from "@workspace/api-zod";

const router: Router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
    | "none"
    | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

function signToken(payload: {
  userId: string;
  role: "admin" | "customer";
  name: string;
  email: string;
}) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, phone, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  let user: { _id: string; name: string; email: string; phone?: string; role: "admin" | "customer" } | null;
  try {
    user = await convex.mutation(api.users.create, {
      name,
      email,
      phone: phone ?? undefined,
      passwordHash,
      role: "customer",
    }) as typeof user;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already registered")) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    throw err;
  }

  const token = signToken({ userId: user!._id, role: "customer", name, email });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(201).json(
    RegisterResponse.parse({
      id: user!._id,
      name,
      email,
      phone: phone ?? null,
      role: "customer",
    }),
  );
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const user = await convex.query(api.users.getByEmail, { email }) as {
    _id: string; name: string; email: string; phone?: string;
    role: "admin" | "customer"; passwordHash: string;
  } | null;

  if (!user) { res.status(401).json({ error: "Invalid email or password" }); return; }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Invalid email or password" }); return; }

  const token = signToken({ userId: user._id, role: user.role, name: user.name, email: user.email });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.json(LoginResponse.parse({ id: user._id, name: user.name, email: user.email, phone: user.phone ?? null, role: user.role }));
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ success: true });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json(GetMeResponse.parse({ id: req.user!.userId, name: req.user!.name, email: req.user!.email, phone: null, role: req.user!.role }));
});

export default router;
