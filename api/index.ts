import app from "../artifacts/api-server/src/app";

// Export the Express app directly as the Vercel handler
// Express apps are compatible with Vercel's serverless function signature
export default app;

