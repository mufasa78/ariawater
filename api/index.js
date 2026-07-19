// Vercel serverless function handler
// Uses the built Express app from the api-server artifact

export default async function handler(req, res) {
  try {
    // Import the serverless build which exports the Express app
    const { default: app } = await import("../artifacts/api-server/dist/serverless.mjs");
    
    // Express apps can be called directly as request handlers
    // They have the signature: (req, res) => void
    await new Promise((resolve, reject) => {
      // Set up completion handlers
      res.on('finish', resolve);
      res.on('error', reject);
      
      // Handle the request with Express
      app(req, res);
    });
  } catch (error) {
    console.error('Serverless function error:', error);
    
    // If response hasn't been sent yet, send error
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}
