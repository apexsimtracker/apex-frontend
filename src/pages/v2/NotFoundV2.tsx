import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { HelpCircle, Home, MessageCircle } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { cn } from "@/lib/utils";

export default function NotFoundV2() {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <>
      <PageMeta
        title={`404 - Page Not Found | ${COMPANY_NAME}`}
        description="The page you are looking for could not be found on Apex."
        path={location.pathname || "/"}
        setCanonical={false}
        noindex
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8">
        <div className="flex flex-1 flex-col items-center justify-center space-y-6">
          <section
            className="w-full max-w-2xl rounded-xl border border-v2-outline-variant/15 bg-gradient-to-b from-v2-surface-container to-v2-background px-6 py-10 text-center sm:px-10 sm:py-12"
            aria-labelledby="not-found-heading"
          >
            <p
              className="font-v2-headline text-6xl font-extrabold tabular-nums leading-none sm:text-7xl md:text-8xl"
              aria-hidden
            >
              <span className="text-v2-on-surface">4</span>
              <span className="text-v2-primary">0</span>
              <span className="text-v2-on-surface">4</span>
            </p>

            <h1
              id="not-found-heading"
              className="mt-6 font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface"
            >
              Oops! Page Not Found.
            </h1>
            <p className="mt-3 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
              The page you are looking for might have been removed, had its name
              changed, or is temporarily unavailable.
            </p>
            <p className="mt-2 font-v2-body text-xs italic text-v2-on-surface-variant/70">
              Wrong turn—this sector isn&apos;t on the timetable.
            </p>

            {location.pathname ? (
              <p className="mt-5">
                <span className="inline-block max-w-full truncate rounded-v2-sm border border-v2-outline-variant/15 bg-v2-surface-container px-3 py-1.5 font-v2-body text-xs text-v2-on-surface-variant">
                  {location.pathname}
                </span>
              </p>
            ) : null}

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Button asChild className={cn("h-11", v2PrimaryButtonClassName)}>
                <Link
                  to="/v2"
                  className="inline-flex items-center justify-center gap-2"
                >
                  <Home className="size-4" aria-hidden />
                  Back to Home
                </Link>
              </Button>
              <Button asChild className={cn("h-11", v2OutlineButtonClassName)}>
                <Link
                  to="/v2/faq"
                  className="inline-flex items-center justify-center gap-2 px-6"
                >
                  <HelpCircle className="size-4" aria-hidden />
                  Browse FAQ
                </Link>
              </Button>
            </div>
          </section>

          <section className="w-full max-w-2xl rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary"
                  aria-hidden
                >
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <p className="font-v2-headline text-sm font-semibold text-v2-on-surface">
                    Can&apos;t find what you&apos;re looking for?
                  </p>
                  <p className="mt-1 max-w-sm font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
                    Our support team is here to help if you think something is
                    broken or missing.
                  </p>
                </div>
              </div>
              <Button
                asChild
                className={cn(
                  "shrink-0 !px-5 !py-2 !text-xs",
                  v2PrimaryButtonClassName,
                )}
              >
                <Link to="/v2/contact">Contact support</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
