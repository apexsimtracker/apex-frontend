import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

export default function VerifyEmailHelpStrip() {
  return (
    <section className="w-full rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-low p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container text-apex-primary"
            aria-hidden
          >
            <LogIn className="size-5" />
          </div>
          <div>
            <p className="font-apex-headline text-sm font-semibold text-apex-on-surface">
              Already verified?
            </p>
            <p className="mt-1 max-w-sm font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
              Sign in to access your sessions, stats, and community profile.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            to="/login"
            className="font-apex-headline text-xs font-bold uppercase tracking-widest text-apex-primary transition-colors hover:text-apex-primary/80"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="font-apex-body text-sm text-apex-on-surface-variant transition-colors hover:text-apex-on-surface"
          >
            Create account
          </Link>
        </div>
      </div>
    </section>
  );
}
