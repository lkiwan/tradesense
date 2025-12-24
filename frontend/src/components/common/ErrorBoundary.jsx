import { Component } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

/**
 * Error Boundary Component
 * Catches JavaScript errors in child component tree and displays a fallback UI
 * Also reports errors to Sentry if configured
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({ errorInfo })

    // Report to Sentry if available
    if (window.Sentry) {
      window.Sentry.withScope((scope) => {
        scope.setExtras(errorInfo)
        const eventId = window.Sentry.captureException(error)
        this.setState({ eventId })
      })
    }

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>

            {/* Error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                <p className="text-sm font-mono text-red-800 dark:text-red-400 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-xs text-red-600 dark:text-red-300 overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Event ID for support */}
            {this.state.eventId && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Error ID: <code className="font-mono">{this.state.eventId}</code>
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Go Home
              </button>

              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Reload Page
              </button>
            </div>

            {/* Sentry feedback button */}
            {this.state.eventId && window.Sentry && (
              <button
                onClick={() => window.Sentry.showReportDialog({ eventId: this.state.eventId })}
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Report this issue
              </button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapper component for functional error boundary usage
export function withErrorBoundary(WrappedComponent, fallback = null) {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}

// Compact error boundary for smaller UI sections
export function CompactErrorBoundary({ children, message = 'Something went wrong' }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
          <p className="text-red-600 dark:text-red-400">{message}</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
