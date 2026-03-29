import React from "react";
import { Link } from "react-router-dom";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error("Error caught by boundary:", error, errorInfo);

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="font-display text-3xl text-black mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 mb-8">
              We're sorry for the inconvenience. An unexpected error has occurred.
              Please try refreshing the page or go back to the homepage.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left mb-8 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer font-semibold text-gray-800 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="text-sm text-gray-700 space-y-2">
                  <p className="font-mono text-red-600">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="overflow-auto text-xs bg-white p-2 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Refresh Page
              </button>
              <Link
                to="/"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:border-black hover:text-black transition-colors"
              >
                Go to Homepage
              </Link>
            </div>

            {/* Support Link */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                If the problem persists, please{" "}
                <Link to="/contact" className="text-black font-medium hover:underline">
                  contact our support team
                </Link>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
