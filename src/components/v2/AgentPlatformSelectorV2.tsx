import { Apple, Monitor } from "lucide-react";
import type { AgentOs } from "@/hooks/useDetectedAgentOs";
import { AGENT_PLATFORM_LABELS } from "@/hooks/useDetectedAgentOs";
import { cn } from "@/lib/utils";

const PLATFORMS: AgentOs[] = ["macos", "windows", "linux"];

type AgentPlatformSelectorV2Props = {
  selectedOs: AgentOs;
  onSelect: (os: AgentOs) => void;
};

function platformIcon(os: AgentOs) {
  if (os === "macos")
    return <Apple className="size-3.5 shrink-0" aria-hidden />;
  return <Monitor className="size-3.5 shrink-0" aria-hidden />;
}

export function AgentPlatformSelectorV2({
  selectedOs,
  onSelect,
}: AgentPlatformSelectorV2Props) {
  return (
    <div
      className="inline-flex w-full gap-2 p-1"
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
            "flex flex-1 items-center justify-center gap-1.5 rounded p-2 font-v2-body text-xs font-bold transition-colors sm:px-3 sm:text-sm",
            selectedOs === os
              ? "bg-v2-primary text-white"
              : "bg-v2-surface-container-low text-v2-on-surface-variant hover:text-v2-on-surface",
          )}
        >
          {platformIcon(os)}
          {AGENT_PLATFORM_LABELS[os]}
        </button>
      ))}
    </div>
  );
}
