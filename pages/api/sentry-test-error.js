import * as Sentry from "@sentry/nextjs";

export default function handler(req, res) {
  try {
    // Deliberately throw an error for testing
    throw new Error("Test backend API error for Sentry");
  } catch (error) {
    // Log the error to console for debugging
    console.error("API Error:", error);
    
    // Send to Sentry
    Sentry.captureException(error);
    
    // Return error response
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: "This error was intentionally triggered for Sentry testing" 
    });
  }
} 