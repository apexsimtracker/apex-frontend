import { Apple, Monitor } from "lucide-react";
import type { AgentOs } from "@/hooks/useDetectedAgentOs";
import { AGENT_PLATFORM_LABELS } from "@/hooks/useDetectedAgentOs";
import { cn } from "@/lib/utils";

const PLATFORMS: AgentOs[] = ["macos", "windows", "linux"];

type AgentPlatformSelectorProps = {
  selectedOs: AgentOs;
  onSelect: (os: AgentOs) => void;
};

function platformIcon(os: AgentOs) {
  if (os === "macos") return <Apple className="size-3.5 shrink-0" aria-hidden />;
  return <Monitor className="size-3.5 shrink-0" aria-hidden />;
}

export function AgentPlatformSelector({ selectedOs, onSelect }: AgentPlatformSelectorProps) {
  return (
    <div
      className="inline-flex w-full rounded-lg border border-white/10 bg-muted/40 p-1"
      role="group"
      aria-label="Download platform"
    >
      {PLATFORMS.map((os) => (
        <button
          key={os}
          type="button"
          aria-pressed={selectedOs === os}
          onClick={() => onSelect(os)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md p-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
            selectedOs === os
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {platformIcon(os)}
          {AGENT_PLATFORM_LABELS[os]}
        </button>
      ))}
    </div>
  );
}
