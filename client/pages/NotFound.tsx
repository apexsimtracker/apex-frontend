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
      <div className="flex flex-1 flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="w-full max-w-lg rounded-xl border border-white/10 bg-white/[0.02] p-8 sm:p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="flex justify-center mb-6">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
              <Flag className="h-8 w-8 text-white/70" strokeWidth={1.75} aria-hidden />
              <span className="absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-[rgba(240,28,28,0.95)] px-1.5 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(240,28,28,0.6)]">
                404
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-[1.65rem] font-semibold tracking-tight text-foreground">
            Oops! Page Not Found.
          </h1>
          <p className="mt-3 text-sm text-white/65 leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is
            temporarily unavailable.
          </p>
          <p className="mt-2 text-xs text-white/45 italic">
            Wrong turn—this sector isn&apos;t on the timetable.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-black hover:bg-white/90 h-11 px-8 font-medium shadow-sm"
            >
              <Link to="/" className="inline-flex items-center justify-center gap-2">
                <Home className="h-4 w-4" aria-hidden />
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
