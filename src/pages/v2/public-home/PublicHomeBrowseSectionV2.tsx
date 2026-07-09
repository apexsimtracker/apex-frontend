import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BROWSE_LINKS, cardClassName } from "./publicHomeV2Shared";
import { IconChip } from "./PublicHomeIconChipV2";

export default function PublicHomeBrowseSectionV2() {
  return (
    <section className={cn(cardClassName, "space-y-6")}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
          Explore without signing in
        </h2>
        <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
          Browse community, challenges, and leaderboards — create an account
          when you&apos;re ready to track your own data.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {BROWSE_LINKS.map(({ icon: Icon, label, description, to }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex h-full items-center gap-3 rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container p-4 transition-colors hover:bg-v2-surface-container-high sm:flex-col sm:items-start sm:gap-0 sm:p-5"
            >
              <IconChip className="size-10 shrink-0 sm:mb-4">
                <Icon className="size-4" />
              </IconChip>
              <div className="min-w-0 flex-1 sm:w-full">
                <span className="font-v2-headline text-sm font-semibold text-v2-on-surface">
                  {label}
                </span>
                <p className="mt-1 font-v2-body text-xs leading-relaxed text-v2-on-surface-variant">
                  {description}
                </p>
              </div>
              <ChevronRight
                className="size-4 shrink-0 text-v2-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-v2-primary sm:mt-4 sm:self-end"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
