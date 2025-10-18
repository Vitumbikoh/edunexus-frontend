import React from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log for diagnostics; in future this can report to a monitoring service
    console.error('Runtime error captured by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    // Attempt a soft reload to recover from transient issues
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const message = this.state.error?.message || 'An unexpected error occurred while rendering this page.';
      const stack = this.state.error?.stack;

      return (
        <div className="flex flex-col gap-2 items-start justify-center p-6 my-8 border rounded-lg bg-red-50 text-red-700">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm">{message}</p>
          {stack && (
            <details className="mt-2 w-full">
              <summary className="cursor-pointer text-sm underline">Show error details</summary>
              <pre className="mt-2 p-3 w-full max-h-60 overflow-auto rounded bg-white text-red-600 text-xs whitespace-pre-wrap">
                {stack}
              </pre>
            </details>
          )}
          <div className="mt-2">
            <button onClick={this.handleReload} className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50">
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
