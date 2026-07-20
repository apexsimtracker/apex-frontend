import type { ReactNode } from "react";
import { Flag, Gauge, Trophy } from "lucide-react";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { cn } from "@/lib/utils";

const sectionEyebrowClassName =
  "font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant";

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
        "flex size-9 shrink-0 items-center justify-center rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container text-apex-primary",
        className,
      )}
      aria-hidden
    >
      {children}
    </div>
  );
}

export default function LoginWelcomePanel() {
  return (
    <div className="hidden lg:block">
      <p className={sectionEyebrowClassName}>Welcome back</p>
      <h1 className="mt-3 font-apex-headline text-3xl font-bold tracking-tight text-apex-on-surface">
        Sign in.
        <span className="block text-apex-primary sm:inline sm:before:content-['\00a0']">
          Get back on track.
        </span>
      </h1>
      <p className="mt-3 max-w-md font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
        Sign in to {COMPANY_NAME} — your sim racing hub.
      </p>

      <ul className="mt-8 space-y-4">
        {FEATURES.map(({ icon: Icon, label, detail }) => (
          <li key={label} className="flex gap-4">
            <IconChip>
              <Icon className="size-4" />
            </IconChip>
            <div className="min-w-0 pt-0.5">
              <p className="font-apex-headline text-sm font-semibold text-apex-on-surface">
                {label}
              </p>
              <p className="mt-0.5 font-apex-body text-sm text-apex-on-surface-variant">
                {detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
