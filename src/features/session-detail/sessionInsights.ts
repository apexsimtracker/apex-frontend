import type { LucideIcon } from "lucide-react";
import { CheckCircle, Timer, Zap, Flag } from "lucide-react";
import { formatLapDelta } from "@/lib/utils";

export type SessionInsight = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function buildSessionInsights(session: {
  lapCount?: number | null;
  bestLapMs?: number | null;
}): SessionInsight[] {
  const insights: SessionInsight[] = [];
  if ((session.lapCount ?? 0) > 0) {
    insights.push({
      title: "Session Completed",
      description: "You completed at least one full lap.",
      icon: CheckCircle,
    });
  }
  if ((session.lapCount ?? 0) >= 3) {
    insights.push({
      title: "Good Track Time",
      description: "You spent meaningful time learning the circuit.",
      icon: Timer,
    });
  }
  if (session.bestLapMs && session.bestLapMs < 120000) {
    insights.push({
      title: "Strong Pace",
      description: "Lap time shows competitive speed.",
      icon: Zap,
    });
  }
  if (insights.length === 0) {
    insights.push({
      title: "Warmup Session",
      description: "No completed laps recorded yet.",
      icon: Flag,
    });
  }
  return insights;
}

export function formatLapDeltaMsForDisplay(deltaMs: number): string {
  const s = formatLapDelta(deltaMs);
  return s === "—" ? "—" : `+${s}`;
}
