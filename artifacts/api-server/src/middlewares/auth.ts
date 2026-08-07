import { Request, Response, NextFunction } from "express";
import { clerkClient, requireAuth as clerkRequireAuth } from "@clerk/express";

export type Role = "admin" | "marketing" | "sales" | "accounting" | "customer";

export interface JwtPayload {
  userId: string;
  role: Role;
  name: string;
  email: string;
  approved: boolean;
}

// Extend Express Request type to include auth from Clerk
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      auth?: {
        userId: string;
        sessionId?: string;
      };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  clerkRequireAuth()(req, res, async (err?: any) => {
    if (err || !req.auth?.userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    try {
      // Get user from Clerk (clerkClient is not a function, it's already the client)
      const user = await clerkClient.users.getUser(req.auth.userId);
      
      // Extract role from publicMetadata (default to "customer")
      const role = (user.publicMetadata.role as Role) || "customer";
      const approved = user.publicMetadata.approved !== false; // default to true

      // Set req.user for compatibility with existing code
      req.user = {
        userId: user.id,
        role,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "User",
        email: user.emailAddresses[0]?.emailAddress || "",
        approved,
      };

      next();
    } catch (error) {
      console.error("Error fetching user from Clerk:", error);
      res.status(500).json({ error: "Failed to authenticate user" });
    }
  });
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

// Optional auth middleware - sets req.user if valid token exists, but doesn't require it
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // Try to authenticate but continue even if it fails
  clerkRequireAuth()(req, res, async (err?: any) => {
    if (err || !req.auth?.userId) {
      // No auth or error - continue without user
      next();
      return;
    }

    try {
      // Get user from Clerk
      const user = await clerkClient.users.getUser(req.auth.userId);
      
      const role = (user.publicMetadata.role as Role) || "customer";
      const approved = user.publicMetadata.approved !== false;

      req.user = {
        userId: user.id,
        role,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "User",
        email: user.emailAddresses[0]?.emailAddress || "",
        approved,
      };
    } catch {
      // Error fetching user - continue without user
    }

    next();
  });
}
