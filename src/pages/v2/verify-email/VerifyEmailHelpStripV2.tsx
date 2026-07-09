import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

export default function VerifyEmailHelpStripV2() {
  return (
    <section className="w-full rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary"
            aria-hidden
          >
            <LogIn className="size-5" />
          </div>
          <div>
            <p className="font-v2-headline text-sm font-semibold text-v2-on-surface">
              Already verified?
            </p>
            <p className="mt-1 max-w-sm font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
              Sign in to access your sessions, stats, and community profile.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            to="/v2/login"
            className="font-v2-headline text-xs font-bold uppercase tracking-widest text-v2-primary transition-colors hover:text-v2-primary/80"
          >
            Sign in
          </Link>
          <Link
            to="/v2/signup"
            className="font-v2-body text-sm text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
          >
            Create account
          </Link>
        </div>
      </div>
    </section>
  );
}
