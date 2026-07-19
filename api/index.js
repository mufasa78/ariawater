// Vercel serverless function handler
// Uses the built Express app from the api-server artifact

export default async function handler(req, res) {
  // Import the serverless build which exports just the Express app
  const { default: app } = await import("../artifacts/api-server/dist/serverless.mjs");
  
  // Call the Express app with the request and response
  return app(req, res);
}
