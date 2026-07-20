import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";

export default function PublicHomeHero() {
  return (
    <header className="mx-auto max-w-4xl text-center">
      <p className="mb-3 font-apex-headline text-sm font-semibold uppercase tracking-wider text-apex-on-surface-variant">
        Sim racing performance hub
      </p>
      <h1 className="text-balance font-apex-headline text-3xl font-bold tracking-tight text-apex-on-surface sm:text-4xl lg:text-5xl">
        Your data.
        <span className="block text-apex-primary sm:inline sm:before:content-['\00a0']">
          One place.
        </span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-pretty font-apex-body text-base leading-relaxed text-apex-on-surface-variant sm:text-lg">
        Track sessions, compare across sims, join challenges, and learn from the
        community — built by a racer who needed professional-grade tools for
        modern prep.
      </p>
      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
        <Button
          asChild
          className={cn(
            "w-full sm:w-auto sm:min-w-[200px]",
            appPrimaryButtonClassName,
          )}
        >
          <Link to="/signup">Create account</Link>
        </Button>
        <Button
          asChild
          className={cn(
            "w-full sm:w-auto sm:min-w-[200px]",
            appOutlineButtonClassName,
          )}
        >
          <Link to="/login">Log in</Link>
        </Button>
      </div>
    </header>
  );
}
