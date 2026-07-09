import type { ReactNode } from "react";
import { Flag, Gauge, Trophy } from "lucide-react";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { cn } from "@/lib/utils";

const sectionEyebrowClassName =
  "font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant";

const FEATURES = [
  {
    icon: Gauge,
    label: "Track every session",
    detail: "Log laps and telemetry in one place.",
  },
  {
    icon: Trophy,
    label: "Climb the leaderboards",
    detail: "Compare times across sims.",
  },
  {
    icon: Flag,
    label: "Join the community",
    detail: "Challenges, discussions, and more.",
  },
] as const;

function IconChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary",
        className,
      )}
      aria-hidden
    >
      {children}
    </div>
  );
}

export default function LoginWelcomePanelV2() {
  return (
    <div className="hidden lg:block">
      <p className={sectionEyebrowClassName}>Welcome back</p>
      <h1 className="mt-3 font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
        Sign in.
        <span className="block text-v2-primary sm:inline sm:before:content-['\00a0']">
          Get back on track.
        </span>
      </h1>
      <p className="mt-3 max-w-md font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
        Sign in to {COMPANY_NAME} — your sim racing hub.
      </p>

      <ul className="mt-8 space-y-4">
        {FEATURES.map(({ icon: Icon, label, detail }) => (
          <li key={label} className="flex gap-4">
            <IconChip>
              <Icon className="size-4" />
            </IconChip>
            <div className="min-w-0 pt-0.5">
              <p className="font-v2-headline text-sm font-semibold text-v2-on-surface">
                {label}
              </p>
              <p className="mt-0.5 font-v2-body text-sm text-v2-on-surface-variant">
                {detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
