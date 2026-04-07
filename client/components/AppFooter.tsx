import { Link } from "react-router-dom";
import { APP_VERSION, SUPPORT_EMAIL } from "@/lib/appConfig";

const linkClass =
  "text-white/50 hover:text-white/70 transition-colors underline underline-offset-2";

export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-white/5 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/40">
          <span>
            Support:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
              {SUPPORT_EMAIL}
            </a>
          </span>
          <span>
            Resources:{" "}
            <Link to="/faq" className={linkClass}>
              FAQ
            </Link>
          </span>
          <span>
            Company:{" "}
            <Link to="/about" className={linkClass}>
              About us
            </Link>
          </span>
          <span>
            Legal:{" "}
            <Link to="/terms-and-conditions" className={linkClass}>
              Terms
            </Link>
            <span className="text-white/25 mx-1.5" aria-hidden>
              ·
            </span>
            <Link to="/privacy-policy" className={linkClass}>
              Privacy
            </Link>
          </span>
          <span>Version: {APP_VERSION}</span>
        </div>
      </div>
    </footer>
  );
}
