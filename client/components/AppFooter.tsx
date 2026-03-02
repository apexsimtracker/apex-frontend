import { APP_VERSION, SUPPORT_EMAIL } from "@/lib/appConfig";

export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-white/5 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-white/40">
          <span>
            Support:{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-white/50 hover:text-white/70 transition-colors underline underline-offset-2"
            >
              {SUPPORT_EMAIL}
            </a>
          </span>
          <span>Version: {APP_VERSION}</span>
        </div>
      </div>
    </footer>
  );
}
