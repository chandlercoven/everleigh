import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function SentryTest() {
  const [errorTriggered, setErrorTriggered] = useState(false);

  // Function to trigger a frontend error
  const triggerFrontendError = () => {
    try {
      // This will throw an error
      throw new Error("Test frontend error for Sentry");
    } catch (error) {
      // Capture and send to Sentry
      Sentry.captureException(error);
      setErrorTriggered(true);
    }
  };

  // Function to trigger an API error
  const triggerApiError = async () => {
    try {
      // This will trigger a 500 error in the API
      const response = await fetch("/api/sentry-test-error");
      if (!response.ok) throw new Error(`API error: ${response.status}`);
    } catch (error) {
      // Capture and send to Sentry
      Sentry.captureException(error);
      setErrorTriggered(true);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sentry Test Page</h1>
      
      <div className="flex flex-col gap-4">
        <button
          onClick={triggerFrontendError}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Trigger Frontend Error
        </button>
        
        <button
          onClick={triggerApiError}
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          Trigger API Error
        </button>
        
        {errorTriggered && (
          <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
            Error successfully triggered and sent to Sentry!
          </div>
        )}
      </div>
    </div>
  );
} 