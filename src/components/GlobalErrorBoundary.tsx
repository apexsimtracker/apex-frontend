import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "@/components/ErrorFallback";

export type GlobalErrorBoundaryProps = {
  children: ReactNode;
};

type GlobalErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : "Unknown error");
}

/**
 * Catches render errors in descendants. Use around route content (e.g. inside &lt;main&gt;)
 * so global chrome (header/footer) can stay mounted.
 */
export default class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<GlobalErrorBoundaryState> {
    return { hasError: true, error: toError(error) };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState((s) => ({ ...s, errorInfo }));
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
  }

  resetBoundary = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const isDev = import.meta.env.DEV;
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          showDebug={isDev}
          onTryAgain={this.resetBoundary}
          onRefreshPage={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
