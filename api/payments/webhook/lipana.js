// Exact Vercel function route for Lipana callbacks.

export default async function handler(req, res) {
  try {
    const { default: app } = await import("../../../artifacts/api-server/dist/serverless.mjs");
    return new Promise((resolve, reject) => {
      res.on("finish", resolve);
      res.on("error", reject);
      app(req, res);
    });
  } catch (error) {
    console.error("Lipana webhook function error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
