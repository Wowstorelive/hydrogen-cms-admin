import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

/**
 * ErrorBoundary - Catch and display React errors gracefully
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you could send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service like Sentry
      console.error('Production error:', { error: error.toString(), componentStack: errorInfo.componentStack });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback, showDetails = false } = this.props;

      // Allow custom fallback UI
      if (fallback) {
        return fallback({
          error: this.state.error,
          resetError: this.handleReset
        });
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Something went wrong</h2>
                    <p className="text-red-100 text-sm">
                      An unexpected error occurred
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  We apologize for the inconvenience. The application encountered an error
                  and couldn't complete your request. Please try one of the options below.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    onClick={this.handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Home className="w-4 h-4" />
                    Go to Dashboard
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload Page
                  </button>
                </div>

                {/* Error Details (collapsible) */}
                {(showDetails || process.env.NODE_ENV !== 'production') && this.state.error && (
                  <details className="bg-gray-50 rounded-lg p-4 border">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Bug className="w-4 h-4" />
                      Technical Details
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Error Message:</p>
                        <code className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded block overflow-x-auto">
                          {this.state.error.toString()}
                        </code>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Component Stack:</p>
                          <pre className="text-xs bg-gray-100 text-gray-700 p-2 rounded overflow-x-auto max-h-40">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * withErrorBoundary - HOC to wrap components with error boundary
 */
export function withErrorBoundary(WrappedComponent, fallback) {
  return function WithErrorBoundaryWrapper(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * ErrorFallback - Simple inline error display
 */
export function ErrorFallback({ error, resetError, message = 'Something went wrong' }) {
  return (
    <div className="p-6 bg-red-50 rounded-lg border border-red-200">
      <div className="flex items-center gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-red-800">{message}</h3>
      </div>
      <p className="text-sm text-red-700 mb-4">
        {error?.message || 'An unexpected error occurred'}
      </p>
      {resetError && (
        <button
          onClick={resetError}
          className="text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;
