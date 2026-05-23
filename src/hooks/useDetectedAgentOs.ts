import { useState } from "react";

export type AgentOs = "macos" | "windows";

export function detectAgentOs(): AgentOs {
  const ua = navigator.userAgent;
  const platform = (
    navigator as Navigator & { userAgentData?: { platform?: string } }
  ).userAgentData?.platform?.toLowerCase();
  if (platform?.includes("mac") || /Mac OS X|Macintosh/i.test(ua)) return "macos";
  if (platform?.includes("win") || /Windows/i.test(ua)) return "windows";
  return "windows";
}

export function useDetectedAgentOs(): {
  detectedOs: AgentOs;
  selectedOs: AgentOs;
  setSelectedOs: (os: AgentOs) => void;
} {
  const [detectedOs] = useState<AgentOs>(() => detectAgentOs());
  const [selectedOs, setSelectedOs] = useState<AgentOs>(detectedOs);

  return { detectedOs, selectedOs, setSelectedOs };
}

export const AGENT_DOWNLOAD_FILENAMES: Record<AgentOs, string> = {
  macos: "ApexAgent-mac.dmg",
  windows: "ApexAgent-windows.exe",
};

export const AGENT_PLATFORM_LABELS: Record<AgentOs, string> = {
  macos: "macOS",
  windows: "Windows",
};
