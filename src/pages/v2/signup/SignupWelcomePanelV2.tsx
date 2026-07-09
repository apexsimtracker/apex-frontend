import type { ReactNode } from "react";
import { Layers, Sparkles, Users } from "lucide-react";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { cn } from "@/lib/utils";

const sectionEyebrowClassName =
  "font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant";

const FEATURES = [
  {
    icon: Layers,
    label: "Every sim, one place",
    detail: "iRacing, F1, Le Mans Ultimate — all in one hub.",
  },
  {
    icon: Sparkles,
    label: "Apex Analysis coaching",
    detail: "Rule-based insights to help you find time.",
  },
  {
    icon: Users,
    label: "Community & challenges",
    detail: "Leaderboards, discussions, and head-to-head events.",
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

export default function SignupWelcomePanelV2() {
  return (
    <div className="hidden lg:block">
      <p className={sectionEyebrowClassName}>Get started</p>
      <h1 className="mt-3 font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
        Create account.
        <span className="block text-v2-primary sm:inline sm:before:content-['\00a0']">
          Start racing smarter.
        </span>
      </h1>
      <p className="mt-3 max-w-md font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
        Join {COMPANY_NAME} — sim racing sessions, leaderboards, and community.
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
