import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BROWSE_LINKS,
  cardClassName,
  sectionEyebrowClassName,
} from "./publicHomeV2Shared";
import { IconChip } from "./PublicHomeIconChipV2";

export default function PublicHomeBrowseSectionV2() {
  return (
    <section className={cn(cardClassName, "relative")}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="lg:max-w-sm">
          <h2 className={sectionEyebrowClassName}>
            Explore without signing in
          </h2>
          <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
            Browse community, challenges, and leaderboards — create an account
            when you&apos;re ready to track your own data.
          </p>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-xs">
          {BROWSE_LINKS.map(({ icon: Icon, label, to }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex items-center gap-3 rounded-v2-sm border border-v2-outline-variant/15 bg-v2-surface-container px-4 py-3 transition-colors hover:border-v2-primary/40"
              >
                <IconChip className="mb-0 size-9 shrink-0">
                  <Icon className="size-4" />
                </IconChip>
                <span className="min-w-0 flex-1 font-v2-headline text-sm font-semibold text-v2-on-surface">
                  {label}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-v2-on-surface-variant"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
