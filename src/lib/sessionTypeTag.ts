/**
 * Session type tag labels and colors — client spec Fix 4.
 */

import {
  isPracticeKind,
  isQualifyingKind,
  isRaceKind,
  isWarmupKind,
} from "./sessionKind";

export type SessionTypeTagKind =
  | "RACE"
  | "QUALIFY"
  | "PRACTICE"
  | "WARMUP"
  | "UNKNOWN";

export type SessionTypeTagStyle = {
  label: SessionTypeTagKind;
  color: string;
  background: string;
};

export const SESSION_TYPE_TAG_STYLES: Record<
  SessionTypeTagKind,
  SessionTypeTagStyle
> = {
  RACE: {
    label: "RACE",
    color: "#E8172B",
    background: "rgba(232, 23, 43, 0.14)",
  },
  QUALIFY: {
    label: "QUALIFY",
    color: "#9B59FF",
    background: "rgba(155, 89, 255, 0.14)",
  },
  PRACTICE: {
    label: "PRACTICE",
    color: "#888888",
    background: "rgba(136, 136, 136, 0.14)",
  },
  WARMUP: {
    label: "WARMUP",
    color: "#F5C518",
    background: "rgba(245, 197, 24, 0.14)",
  },
  UNKNOWN: {
    label: "UNKNOWN",
    color: "#888888",
    background: "rgba(136, 136, 136, 0.14)",
  },
};

export function resolveSessionTypeTagKind(session: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}): SessionTypeTagKind {
  if (isRaceKind(session)) return "RACE";
  if (isQualifyingKind(session)) return "QUALIFY";
  if (isWarmupKind(session)) return "WARMUP";
  if (isPracticeKind(session)) return "PRACTICE";
  return "UNKNOWN";
}

export function getSessionTypeTagStyle(session: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}): SessionTypeTagStyle {
  return SESSION_TYPE_TAG_STYLES[resolveSessionTypeTagKind(session)];
}
