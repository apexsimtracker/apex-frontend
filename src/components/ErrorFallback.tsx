import { useState, type ErrorInfo } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
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
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div
        className="w-full max-w-lg rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-10"
        role="alert"
        aria-labelledby="error-fallback-heading"
        aria-describedby="error-fallback-desc"
      >
        <div className="mb-6 flex justify-center">
          <div
            className="flex size-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10"
            aria-hidden
          >
            <AlertCircle
              className="size-8 text-red-400/95"
              strokeWidth={1.75}
            />
          </div>
        </div>

        <h1
          id="error-fallback-heading"
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]"
        >
          Something went wrong.
        </h1>
        <p
          id="error-fallback-desc"
          className="mt-3 text-sm leading-relaxed text-white/65"
        >
          The application encountered an unexpected error.
        </p>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            size="lg"
            onClick={onTryAgain}
            className="h-11 bg-white px-8 font-medium text-black shadow-sm hover:bg-white/90"
          >
            <RotateCcw className="size-4" aria-hidden />
            Try Again
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onRefreshPage}
            className="h-11 border-white/15 bg-white/5 px-8 text-white hover:bg-white/10"
          >
            <RefreshCw className="size-4" aria-hidden />
            Refresh Page
          </Button>
        </div>

        {showDebug &&
          (error?.message || error?.stack || errorInfo?.componentStack) && (
            <div className="mt-8 border-t border-white/10 pt-6 text-left">
              <button
                type="button"
                onClick={() => setDebugOpen((o) => !o)}
                className="flex w-full items-center gap-2 rounded-md text-xs text-white/50 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={debugOpen}
                aria-controls="error-fallback-debug"
              >
                {debugOpen ? (
                  <ChevronUp className="size-4 shrink-0" />
                ) : (
                  <ChevronDown className="size-4 shrink-0" />
                )}
                Technical details
              </button>
              {debugOpen && (
                <pre
                  id="error-fallback-debug"
                  className="mt-3 max-h-48 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/60"
                  tabIndex={0}
                >
                  {error?.message && `${error.message}\n\n`}
                  {error?.stack && `Stack:\n${error.stack}`}
                  {errorInfo?.componentStack &&
                    `\n\nComponent stack:\n${errorInfo.componentStack}`}
                </pre>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
