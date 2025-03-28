import React, { Component, ErrorInfo, ReactNode } from 'react';

// Declare Sentry on window
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, options?: any) => void;
    };
  }
}

// Define props interface
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Define state interface
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state to display the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    // Send error to Sentry if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise render our default fallback UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px auto',
          maxWidth: '800px',
          backgroundColor: '#fff5f5',
          border: '1px solid #feb2b2',
          borderRadius: '8px',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ color: '#c53030' }}>Something went wrong</h2>
          <p>We encountered an error while loading this component.</p>
          <details style={{ 
            margin: '10px 0',
            padding: '10px', 
            backgroundColor: '#fff', 
            border: '1px solid #eee',
            borderRadius: '4px'
          }}>
            <summary>Error details</summary>
            <pre style={{
              overflow: 'auto',
              padding: '10px',
              backgroundColor: '#f7fafc',
              color: '#4a5568',
              fontSize: '14px',
              borderRadius: '4px'
            }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    // If no error, render children
    return this.props.children;
  }
}

export default ErrorBoundary; 