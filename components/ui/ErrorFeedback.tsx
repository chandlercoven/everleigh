import React, { useState } from 'react';

/**
 * Props interface for ErrorFeedback component
 */
interface ErrorFeedbackProps {
  message: string;
  type?: string;
  details?: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  dismissable?: boolean;
  className?: string;
}

/**
 * ErrorFeedback - User-friendly error display with troubleshooting steps
 */
const ErrorFeedback: React.FC<ErrorFeedbackProps> = ({ 
  message, 
  type = 'unknown', 
  details,
  onRetry,
  onDismiss,
  dismissable = true,
  className = ''
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  if (dismissed) return null;

  // Get appropriate icon and color based on error type
  const getErrorTypeInfo = () => {
    switch (type) {
      case 'permission_denied':
        return {
          icon: '🔒',
          title: 'Permission Required',
          color: 'bg-yellow-100 border-yellow-400 text-yellow-800',
          colorDark: 'dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200'
        };
      case 'device_not_found':
        return {
          icon: '🎤',
          title: 'Microphone Not Found',
          color: 'bg-orange-100 border-orange-400 text-orange-800',
          colorDark: 'dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-200'
        };
      case 'device_in_use':
        return {
          icon: '🔊',
          title: 'Microphone In Use',
          color: 'bg-orange-100 border-orange-400 text-orange-800',
          colorDark: 'dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-200'
        };
      case 'transcription_error':
        return {
          icon: '📝',
          title: 'Transcription Error',
          color: 'bg-purple-100 border-purple-400 text-purple-800',
          colorDark: 'dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-200'
        };
      case 'processing_error':
        return {
          icon: '🤖',
          title: 'AI Processing Error',
          color: 'bg-blue-100 border-blue-400 text-blue-800',
          colorDark: 'dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200'
        };
      case 'network_error':
        return {
          icon: '🌐',
          title: 'Network Error',
          color: 'bg-red-100 border-red-400 text-red-800',
          colorDark: 'dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'
        };
      default:
        return {
          icon: '⚠️',
          title: 'Error',
          color: 'bg-red-100 border-red-400 text-red-800',
          colorDark: 'dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'
        };
    }
  };

  // Get troubleshooting steps based on error type
  const getTroubleshootingSteps = () => {
    switch (type) {
      case 'permission_denied':
        return [
          "Click the lock or camera icon in your browser's address bar",
          "Make sure microphone permissions are set to 'Allow'",
          "Refresh the page and try again",
          "If using Safari, check your Privacy & Security settings"
        ];
      case 'device_not_found':
        return [
          "Check that your microphone is properly connected",
          "Make sure no other device is using your microphone",
          "Try using a different microphone if available",
          "Restart your browser or computer"
        ];
      case 'device_in_use':
        return [
          "Close other apps that might be using your microphone",
          "Check for video conferencing software running in the background",
          "Restart your browser and try again"
        ];
      case 'transcription_error':
        return [
          "Try speaking more clearly and at a moderate pace",
          "Reduce background noise if possible",
          "Check your internet connection",
          "Try again in a few moments"
        ];
      case 'processing_error':
      case 'ai_service_error':
        return [
          "Our AI service may be temporarily unavailable",
          "Wait a moment and try again",
          "If the problem persists, try refreshing the page"
        ];
      case 'network_error':
        return [
          "Check your internet connection",
          "Try refreshing the page",
          "If you're on a mobile device, try switching from Wi-Fi to cellular data or vice versa"
        ];
      default:
        return [
          "Try refreshing the page",
          "Check your internet connection",
          "If the problem persists, try again later"
        ];
    }
  };

  const { icon, title, color, colorDark } = getErrorTypeInfo();
  const steps = getTroubleshootingSteps();

  // Handle dismiss click
  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div className={`rounded-md border p-4 ${color} ${colorDark} ${className}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0 text-2xl mr-3">
          {icon}
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-medium">{title}</h3>
          <div className="mt-1">
            <p>{message}</p>
            
            {steps.length > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  className="text-sm font-medium underline focus:outline-none"
                  onClick={() => setExpanded(!expanded)}
                  aria-expanded={expanded}
                >
                  {expanded ? 'Hide troubleshooting steps' : 'Show troubleshooting steps'}
                </button>
                
                {expanded && (
                  <ul className="mt-2 ml-5 list-disc text-sm space-y-1">
                    {steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {details && expanded && (
              <div className="mt-2 text-xs opacity-75 font-mono border-t pt-2 overflow-x-auto">
                {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
              </div>
            )}
            
            <div className="mt-4 flex space-x-3">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-current text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                >
                  Try Again
                </button>
              )}
              
              {dismissable && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-sm font-medium focus:outline-none"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorFeedback; 