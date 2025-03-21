import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to display the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or error tracking service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
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