import { useState, useCallback } from 'react';
import { useVoiceChatStore } from '../lib/store';

/**
 * Custom hook for centralized error handling
 * Manages error state and provides methods for handling different error types
 */
const useErrorHandler = () => {
  // Local error state for UI display
  const [errorInfo, setErrorInfo] = useState(null);
  
  // Access error clearing method from store
  const clearError = useVoiceChatStore(state => state.clearError);
  
  // Handle and categorize errors
  const handleError = useCallback((error, options = {}) => {
    const {
      type = 'unknown',
      source = 'application',
      details = null,
      silent = false
    } = options;
    
    // Build error info object
    const errorObj = {
      message: error?.message || 'An unexpected error occurred',
      type,
      source,
      details: details || error?.stack || null,
      timestamp: new Date()
    };
    
    // Log error to console (unless silent)
    if (!silent) {
      console.error(`[${source}] ${type} error:`, error);
    }
    
    // Update state with error info
    setErrorInfo(errorObj);
    
    return errorObj;
  }, []);
  
  // Clear all errors (both local and in store)
  const clearErrorState = useCallback(() => {
    setErrorInfo(null);
    clearError();
  }, [clearError]);
  
  // Specialized error handlers for common scenarios
  const handleNetworkError = useCallback((error, source = 'network') => {
    return handleError(error, { type: 'network_error', source });
  }, [handleError]);
  
  const handleProcessingError = useCallback((error, source = 'processing') => {
    return handleError(error, { type: 'processing_error', source });
  }, [handleError]);
  
  const handlePermissionError = useCallback((error, source = 'permissions') => {
    return handleError(error, { type: 'permission_error', source });
  }, [handleError]);
  
  return {
    errorInfo,
    handleError,
    handleNetworkError,
    handleProcessingError,
    handlePermissionError,
    clearErrorState,
    setErrorInfo
  };
};

export default useErrorHandler; 