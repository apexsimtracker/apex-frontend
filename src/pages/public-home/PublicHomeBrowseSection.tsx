import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BROWSE_LINKS, cardClassName } from "./publicHomeShared";
import { IconChip } from "./PublicHomeIconChip";

export default function PublicHomeBrowseSection() {
  return (
    <section className={cn(cardClassName, "space-y-6")}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface">
          Explore without signing in
        </h2>
        <p className="mt-2 font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
          Browse community, challenges, and leaderboards — create an account
          when you&apos;re ready to track your own data.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {BROWSE_LINKS.map(({ icon: Icon, label, description, to }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex h-full items-center gap-3 rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container p-4 transition-colors hover:bg-apex-surface-container-high sm:flex-col sm:items-start sm:gap-0 sm:p-5"
            >
              <IconChip className="size-10 shrink-0 sm:mb-4">
                <Icon className="size-4" />
              </IconChip>
              <div className="min-w-0 flex-1 sm:w-full">
                <span className="font-apex-headline text-sm font-semibold text-apex-on-surface">
                  {label}
                </span>
                <p className="mt-1 font-apex-body text-xs leading-relaxed text-apex-on-surface-variant">
                  {description}
                </p>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-apex-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-apex-primary sm:mt-4 sm:self-end"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
