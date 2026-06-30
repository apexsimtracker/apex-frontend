import type { LucideIcon } from "lucide-react";
import { Apple, Info, Monitor, Sparkles, User, Wifi } from "lucide-react";
import type { AgentOs } from "@/hooks/useDetectedAgentOs";
import { cn } from "@/lib/utils";

type RequirementItem = {
  icon: LucideIcon;
  label: string;
  description?: string;
};

function requirementsForOs(os: AgentOs): RequirementItem[] {
  const pro: RequirementItem = {
    icon: Sparkles,
    label: "Apex Pro",
    description:
      "Active subscription required to download and upload telemetry.",
  };
  const internet: RequirementItem = {
    icon: Wifi,
    label: "Internet",
    description: "Needed to sign in and sync sessions to your account.",
  };
  const account: RequirementItem = {
    icon: User,
    label: "Website account",
    description:
      "Sign in with the same email and password you use on the Apex website.",
  };

  if (os === "macos") {
    return [
      {
        icon: Apple,
        label: "macOS 12+",
        description: "Runs from the menu bar on Monterey or later.",
      },
      pro,
      account,
      internet,
    ];
  }
  if (os === "linux") {
    return [
      {
        icon: Monitor,
        label: "Linux x64",
        description:
          "AppImage-compatible distribution with system tray support.",
      },
      pro,
      account,
      internet,
    ];
  }
  return [
    {
      icon: Monitor,
      label: "Windows 10 / 11",
      description: "Runs from the system tray on 64-bit Windows.",
    },
    pro,
    account,
    internet,
  ];
}

function platformScopeNote(os: AgentOs): string | null {
  if (os === "windows") {
    return null;
  }
  if (os === "macos") {
    return "On macOS, automatic capture is available for F1 25. iRacing and Le Mans Ultimate automation require Windows.";
  }
  return "On Linux, automatic capture is available for F1 25. iRacing and Le Mans Ultimate automation require Windows.";
}

type AgentInstallRequirementsProps = {
  os: AgentOs;
  className?: string;
};

export function AgentInstallRequirements({
  os,
  className,
}: AgentInstallRequirementsProps) {
  const requirements = requirementsForOs(os);
  const scopeNote = platformScopeNote(os);

  return (
    <section
      className={cn(
        "rounded-xl border border-white/10 bg-card/50 p-6 sm:p-7",
        className,
      )}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
        Before you install
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything you need on{" "}
        {os === "macos" ? "Mac" : os === "linux" ? "Linux" : "Windows"} for this
        build.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {requirements.map((item) => (
          <li
            key={item.label}
            className="flex gap-3 rounded-lg border border-white/10 bg-muted/20 p-4"
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-background/60"
              aria-hidden
            >
              <item.icon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {item.label}
              </p>
              {item.description ? (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {scopeNote ? (
        <div
          className="mt-5 flex gap-3 rounded-lg border border-white/10 bg-muted/20 px-4 py-3.5"
          role="note"
        >
          <Info
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Platform scope
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {scopeNote}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
