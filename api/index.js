// Vercel serverless function handler for /api/*
// This is the main entry point that handles ALL API routes

export default async function handler(req, res) {
  try {
    // Import the Express app from the built serverless bundle
    const { default: app } = await import("../artifacts/api-server/dist/serverless.mjs");
    
    // Express apps can be called directly as request handlers
    return new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('error', reject);
      
      // Handle the request with Express
      app(req, res);
    });
  } catch (error) {
    console.error('API serverless function error:', error);
    
    // Send error response if headers haven't been sent
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}
