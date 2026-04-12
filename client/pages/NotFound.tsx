import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Flag, Home } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";

const NotFound = () => {
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
        title="404 - Page Not Found"
        description="The page you are looking for could not be found on Apex."
        path={location.pathname || "/"}
        setCanonical={false}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="w-full max-w-lg rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-10">
          <div className="mb-6 flex justify-center">
            <div className="relative flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
              <Flag className="size-8 text-white/70" strokeWidth={1.75} aria-hidden />
              <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[rgba(240,28,28,0.95)] px-1.5 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(240,28,28,0.6)]">
                404
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
            Oops! Page Not Found.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            The page you are looking for might have been removed, had its name changed, or is
            temporarily unavailable.
          </p>
          <p className="mt-2 text-xs italic text-white/45">
            Wrong turn—this sector isn&apos;t on the timetable.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-11 bg-white px-8 font-medium text-black shadow-sm hover:bg-white/90"
            >
              <Link to="/" className="inline-flex items-center justify-center gap-2">
                <Home className="size-4" aria-hidden />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
