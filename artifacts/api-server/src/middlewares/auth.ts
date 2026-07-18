import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type Role = "admin" | "marketing" | "sales" | "accounting" | "customer";

export interface JwtPayload {
  userId: string;
  role: Role;
  name: string;
  email: string;
  approved: boolean;
}

function getToken(req: Request): string | undefined {
  // Prefer httpOnly cookie; fall back to Authorization: Bearer <token>
  const cookie = req.cookies?.token as string | undefined;
  if (cookie) return cookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return undefined;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireApproved(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user?.approved) {
      res.status(403).json({ error: "Account not approved by admin" });
      return;
    }
    next();
  });
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireApproved(req, res, () => {
      if (!roles.includes(req.user?.role as Role)) {
        res.status(403).json({ error: `This action requires one of: ${roles.join(", ")}` });
        return;
      }
      next();
    });
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireRole("admin")(req, res, next);
}
