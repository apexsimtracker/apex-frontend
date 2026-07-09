import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";
import {
  gradientCardClassName,
  HERO_STATS,
  sectionEyebrowClassName,
} from "./publicHomeV2Shared";

export default function PublicHomeHeroV2() {
  return (
    <section className="relative mx-auto max-w-3xl">
      <div className={cn(gradientCardClassName, "text-center")}>
        <p className={sectionEyebrowClassName}>Sim racing performance hub</p>
        <h1 className="mt-3 font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface sm:text-4xl lg:text-5xl">
          Your data.
          <span className="block text-v2-primary sm:inline sm:before:content-['\00a0']">
            One place.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
          Track sessions, compare across sims, join challenges, and learn from
          the community — built by a racer who needed professional-grade tools
          for modern prep.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Button
            asChild
            className={cn("sm:min-w-[200px]", v2PrimaryButtonClassName)}
          >
            <Link to="/v2/signup">Create account</Link>
          </Button>
          <Button
            asChild
            className={cn("sm:min-w-[200px]", v2OutlineButtonClassName)}
          >
            <Link to="/v2/login">Log in</Link>
          </Button>
        </div>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {HERO_STATS.map(({ value, label }) => (
            <li
              key={label}
              className="rounded-v2-sm border border-v2-outline-variant/15 bg-v2-surface-container px-3 py-1.5 font-v2-headline text-xs text-v2-on-surface-variant"
            >
              <span className="font-semibold text-v2-on-surface">{value}</span>{" "}
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
