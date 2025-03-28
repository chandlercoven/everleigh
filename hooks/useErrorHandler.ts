import { useState, useCallback } from 'react';
import { ErrorInfo, ErrorHandlerHook } from '../types';

/**
 * Custom hook to manage error state and handle different types of errors
 */
const useErrorHandler = (): ErrorHandlerHook => {
  // State to keep track of error information
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  
  /**
   * Generic error handler with metadata support
   */
  const handleError = useCallback((error: Error, metadata: Partial<ErrorInfo> = {}): void => {
    console.error('Error occurred:', error, metadata);
    
    setErrorInfo({
      error,
      message: error.message,
      type: metadata.type || 'unknown',
      source: metadata.source || 'application',
      details: metadata.details || null,
      timestamp: new Date()
    });
  }, []);
  
  /**
   * Handle processing errors (audio, text input, etc.)
   */
  const handleProcessingError = useCallback((error: Error, source: string): void => {
    let errorType = 'processing_error';
    let details = null;
    
    // Determine error type based on error message
    if (error.message.includes('permissions') || error.message.includes('denied')) {
      errorType = 'permission_error';
    } else if (error.message.includes('network') || error.message.includes('connection')) {
      errorType = 'network_error';
    } else if (error.message.includes('timeout')) {
      errorType = 'timeout_error';
    } else if (error.message.includes('speech') || error.message.includes('detected')) {
      errorType = 'speech_detection_error';
      details = 'No speech was detected. Please try speaking more clearly.';
    }
    
    handleError(error, {
      type: errorType,
      source,
      details
    });
  }, [handleError]);
  
  /**
   * Handle permission-related errors
   */
  const handlePermissionError = useCallback((error: Error, device: string): void => {
    handleError(error, {
      type: 'permission_error',
      source: device,
      details: `Please grant ${device} permission to use this feature.`
    });
  }, [handleError]);
  
  /**
   * Clear the error state
   */
  const clearErrorState = useCallback((): void => {
    setErrorInfo(null);
  }, []);
  
  // Return all error handling methods and state
  return {
    errorInfo,
    handleError,
    handleProcessingError,
    handlePermissionError,
    clearErrorState
  };
};

export default useErrorHandler; 