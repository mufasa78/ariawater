// Augment Express Request with the JWT payload attached by requireAuth middleware
declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      role: "admin" | "customer";
      name: string;
      email: string;
    };
  }
}
