import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import PageMeta from "@/components/PageMeta";
import type { ErrorFallbackProps } from "@/components/ErrorFallback";
import { Button } from "@/components/ui/button";
import {
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { cn } from "@/lib/utils";

export default function AppErrorFallback({
  onTryAgain,
  onRefreshPage,
  error,
  errorInfo,
  showDebug = false,
}: ErrorFallbackProps) {
  const location = useLocation();
  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <>
      <PageMeta
        title={`Something went wrong | ${COMPANY_NAME}`}
        description="The application encountered an unexpected error."
        path={location.pathname || "/"}
        setCanonical={false}
        noindex
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8">
        <div className="flex flex-1 flex-col items-center justify-center space-y-6">
          <section
            className="w-full max-w-2xl rounded-xl border border-apex-outline-variant/15 bg-gradient-to-b from-apex-surface-container to-apex-background px-6 py-10 text-center sm:px-10 sm:py-12"
            role="alert"
            aria-labelledby="error-fallback-heading"
            aria-describedby="error-fallback-desc"
          >
            <p
              className="font-apex-headline text-6xl font-extrabold tabular-nums leading-none text-apex-error sm:text-7xl md:text-8xl"
              aria-hidden
            >
              !
            </p>

            <h1
              id="error-fallback-heading"
              className="mt-6 font-apex-headline text-3xl font-bold tracking-tight text-apex-on-surface"
            >
              Something went wrong.
            </h1>
            <p
              id="error-fallback-desc"
              className="mt-3 font-apex-body text-sm leading-relaxed text-apex-on-surface-variant"
            >
              The application encountered an unexpected error.
            </p>

            {location.pathname ? (
              <p className="mt-5">
                <span className="inline-block max-w-full truncate rounded-apex-sm border border-apex-outline-variant/15 bg-apex-surface-container px-3 py-1.5 font-apex-body text-xs text-apex-on-surface-variant">
                  {location.pathname}
                </span>
              </p>
            ) : null}

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Button
                type="button"
                onClick={onTryAgain}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2",
                  appPrimaryButtonClassName,
                )}
              >
                <RotateCcw className="size-4" aria-hidden />
                Try Again
              </Button>
              <Button
                type="button"
                onClick={onRefreshPage}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 px-6",
                  appOutlineButtonClassName,
                )}
              >
                <RefreshCw className="size-4" aria-hidden />
                Refresh Page
              </Button>
            </div>

            {showDebug &&
              (error?.message || error?.stack || errorInfo?.componentStack) && (
                <div className="mt-8 border-t border-apex-outline-variant/15 pt-6 text-left">
                  <button
                    type="button"
                    onClick={() => setDebugOpen((o) => !o)}
                    className="flex w-full items-center gap-2 rounded-apex-sm font-apex-body text-xs text-apex-on-surface-variant transition-colors hover:text-apex-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary"
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
                      className="mt-3 max-h-48 overflow-auto rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container p-3 font-apex-body text-xs text-apex-on-surface-variant"
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
          </section>

          <section className="w-full max-w-2xl rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-low p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container text-apex-primary"
                  aria-hidden
                >
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <p className="font-apex-headline text-sm font-semibold text-apex-on-surface">
                    Can&apos;t find what you&apos;re looking for?
                  </p>
                  <p className="mt-1 max-w-sm font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
                    Our support team is here to help if you think something is
                    broken or missing.
                  </p>
                </div>
              </div>
              <Button
                asChild
                className={cn(
                  "shrink-0 !px-5 !py-2 !text-xs",
                  appPrimaryButtonClassName,
                )}
              >
                <Link to="/contact">Contact support</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
