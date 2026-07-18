import { JwtPayload } from "../middlewares/auth";

// Augment Express Request with the JWT payload attached by requireAuth middleware
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
