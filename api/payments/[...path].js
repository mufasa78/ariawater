// Explicit nested function route for payment callbacks on Vercel.
// This avoids platform routing ambiguity for /api/payments/* paths.

export default async function handler(req, res) {
  try {
    const { default: app } = await import("../../artifacts/api-server/dist/serverless.mjs");

    return new Promise((resolve, reject) => {
      res.on("finish", resolve);
      res.on("error", reject);
      app(req, res);
    });
  } catch (error) {
    console.error("Payment serverless function error:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
