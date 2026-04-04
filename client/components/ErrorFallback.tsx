import { useState, type ErrorInfo } from "react";
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ErrorFallbackProps = {
  /** Resets the parent error boundary so the app can render again. */
  onTryAgain: () => void;
  /** Full page reload (e.g. clears bad transient state). */
  onRefreshPage: () => void;
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
  /** When true, show expandable technical details (typically dev only). */
  showDebug?: boolean;
};

/**
 * Full-area fallback UI for global/route error boundaries. Styled to match the Apex dark theme.
 */
export function ErrorFallback({
  onTryAgain,
  onRefreshPage,
  error,
  errorInfo,
  showDebug = false,
}: ErrorFallbackProps) {
  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div
        className="w-full max-w-lg rounded-xl border border-white/10 bg-white/[0.02] p-8 sm:p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
        role="alert"
        aria-labelledby="error-fallback-heading"
        aria-describedby="error-fallback-desc"
      >
        <div className="flex justify-center mb-6">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10"
            aria-hidden
          >
            <AlertCircle className="h-8 w-8 text-red-400/95" strokeWidth={1.75} />
          </div>
        </div>

        <h1
          id="error-fallback-heading"
          className="text-2xl sm:text-[1.65rem] font-semibold tracking-tight text-foreground"
        >
          Something went wrong.
        </h1>
        <p id="error-fallback-desc" className="mt-3 text-sm text-white/65 leading-relaxed">
          The application encountered an unexpected error.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Button
            type="button"
            size="lg"
            onClick={onTryAgain}
            className="bg-white text-black hover:bg-white/90 h-11 px-8 font-medium shadow-sm"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Try Again
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onRefreshPage}
            className="border-white/15 bg-white/5 text-white hover:bg-white/10 h-11 px-8"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh Page
          </Button>
        </div>

        {showDebug && (error?.message || error?.stack || errorInfo?.componentStack) && (
          <div className="mt-8 text-left border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={() => setDebugOpen((o) => !o)}
              className="flex items-center gap-2 w-full text-xs text-white/50 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              aria-expanded={debugOpen}
              aria-controls="error-fallback-debug"
            >
              {debugOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              Technical details
            </button>
            {debugOpen && (
              <pre
                id="error-fallback-debug"
                className="mt-3 p-3 rounded-lg bg-black/30 border border-white/10 text-xs text-white/60 overflow-auto max-h-48"
                tabIndex={0}
              >
                {error?.message && `${error.message}\n\n`}
                {error?.stack && `Stack:\n${error.stack}`}
                {errorInfo?.componentStack && `\n\nComponent stack:\n${errorInfo.componentStack}`}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
