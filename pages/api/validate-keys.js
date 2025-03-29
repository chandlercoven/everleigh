/**
 * API endpoint to check API key validity
 * This endpoint validates critical API keys and reports their status
 */

import { apiError } from '../../lib/api/middleware';
import { withAuth } from '../../lib/modern-auth';

// Import our validation functions
import { validateOpenAIKey, validateLiveKitKeys, validateAllKeys } from '../../scripts/validation/validate-api-keys';

// Protect this endpoint - only authenticated admins should access it
export default withAuth(async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return apiError(res, 405, 'Method not allowed');
  }

  try {
    // Check if user has admin role
    if (!req.user?.role?.includes('admin')) {
      return apiError(res, 403, 'Forbidden: Admin access required');
    }
    
    // Parse query parameters
    const validateSingle = req.query.key;
    const detailed = req.query.detailed === 'true';
    
    // Validate a single key type
    if (validateSingle) {
      let result = false;
      let message = '';
      
      switch (validateSingle.toLowerCase()) {
        case 'openai':
          result = await validateOpenAIKey();
          message = result ? 'OpenAI API key is valid' : 'OpenAI API key validation failed';
          break;
        case 'livekit':
          result = await validateLiveKitKeys();
          message = result ? 'LiveKit API keys are valid' : 'LiveKit API keys validation failed';
          break;
        default:
          return apiError(res, 400, `Unknown key type: ${validateSingle}`);
      }
      
      return res.status(result ? 200 : 400).json({
        status: result ? 'valid' : 'invalid',
        message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate all keys
    const allValid = await validateAllKeys();
    
    // Collect detailed results if requested
    let details = {};
    if (detailed) {
      details = {
        openai: await validateOpenAIKey(),
        livekit: await validateLiveKitKeys(),
        // Add more key validations here
      };
    }
    
    // Return the validation results
    return res.status(allValid ? 200 : 400).json({
      status: allValid ? 'valid' : 'invalid',
      message: allValid ? 'All API keys are valid' : 'Some API keys are invalid',
      ...(detailed && { details }),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error validating API keys:', error);
    return apiError(res, 500, 'Error validating API keys', error.message);
  }
}); 