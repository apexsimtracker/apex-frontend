import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";

export default function PublicHomeHeroV2() {
  return (
    <header className="mx-auto max-w-4xl text-center">
      <p className="mb-3 font-v2-headline text-sm font-semibold uppercase tracking-wider text-v2-on-surface-variant">
        Sim racing performance hub
      </p>
      <h1 className="text-balance font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface sm:text-4xl lg:text-5xl">
        Your data.
        <span className="block text-v2-primary sm:inline sm:before:content-['\00a0']">
          One place.
        </span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-pretty font-v2-body text-base leading-relaxed text-v2-on-surface-variant sm:text-lg">
        Track sessions, compare across sims, join challenges, and learn from the
        community — built by a racer who needed professional-grade tools for
        modern prep.
      </p>
      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
        <Button
          asChild
          className={cn(
            "w-full sm:w-auto sm:min-w-[200px]",
            v2PrimaryButtonClassName,
          )}
        >
          <Link to="/v2/signup">Create account</Link>
        </Button>
        <Button
          asChild
          className={cn(
            "w-full sm:w-auto sm:min-w-[200px]",
            v2OutlineButtonClassName,
          )}
        >
          <Link to="/v2/login">Log in</Link>
        </Button>
      </div>
    </header>
  );
}
