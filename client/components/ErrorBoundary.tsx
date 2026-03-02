import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState((s) => ({ ...s, errorInfo }));
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const isDev = import.meta.env.DEV;
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          showDebug={isDev}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({
  error,
  errorInfo,
  showDebug,
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  showDebug: boolean;
}) {
  const [debugOpen, setDebugOpen] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.02] p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-white/60">
          Try refreshing the page. If this keeps happening, contact support.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.location.reload()}
            className="bg-white text-black hover:bg-white/90"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" asChild className="border-white/20 text-white/80 hover:bg-white/10">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
        {showDebug && (error.message || error.stack || errorInfo?.componentStack) && (
          <div className="mt-6 text-left">
            <button
              type="button"
              onClick={() => setDebugOpen((o) => !o)}
              className="flex items-center gap-2 w-full text-xs text-white/50 hover:text-white/70"
            >
              {debugOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Debug info
            </button>
            {debugOpen && (
              <pre className="mt-2 p-3 rounded-lg bg-black/30 border border-white/10 text-xs text-white/60 overflow-auto max-h-48">
                {error.message && `${error.message}\n\n`}
                {error.stack && `Stack:\n${error.stack}`}
                {errorInfo?.componentStack && `\n\nComponent stack:\n${errorInfo.componentStack}`}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
