// Vercel catch-all serverless function for /api/*
// This handles all API routes through the Express app

export default async function handler(req, res) {
  try {
    // Import the Express app from the built serverless bundle
    const { default: app } = await import("../artifacts/api-server/dist/serverless.mjs");
    
    // Call Express app as a request handler
    return new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('error', reject);
      
      // Express will handle the request
      app(req, res);
    });
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // Return error response
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}
