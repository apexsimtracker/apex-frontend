import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.02] p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <AlertTriangle className="h-6 w-6 text-white/50" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-white/60">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
