import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  LayoutGrid,
  MessageCircle,
  Target,
  Trophy,
  Upload,
  Zap,
} from "lucide-react";
import { COMPANY_NAME } from "@/lib/siteMeta";

export const PUBLIC_HOME_V2_PATH = "/v2";

export const SIMS = ["iRacing", "F1 25", "Le Mans Ultimate"] as const;

export const PUBLIC_HOME_TITLE = `${COMPANY_NAME} — Sim racing performance hub`;
export const PUBLIC_HOME_DESCRIPTION = `${COMPANY_NAME}: session logging, telemetry, leaderboards, challenges, community, and Apex Analysis coaching — one place for every sim you run.`;

export const FOUNDER_CREDENTIALS = [
  "British GT Championship",
  "Barwell Motorsport",
  "#63 Lamborghini Huracán GT3 Evo2",
] as const;

export const cardClassName =
  "rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-6 sm:p-7";

export const accentPanelClassName =
  "rounded-r-xl border-l-4 border-v2-primary bg-v2-surface-container/50 p-6 sm:p-7";

export const sectionEyebrowClassName =
  "font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant";

export const iconChipClassName =
  "flex size-10 items-center justify-center rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container text-v2-primary";

export const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Activity feed & goals",
    description:
      "See your sessions and weekly targets alongside the community — your home base when you're logged in.",
  },
  {
    icon: BarChart3,
    title: "Sessions & stats",
    description:
      "Log performance and spot trends instead of scattering notes across spreadsheets.",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    description:
      "Compare laps and climb the ranks — see where you stand against the field.",
  },
  {
    icon: Target,
    title: "Challenges",
    description:
      "Enter events, qualify, and compete in structured sim racing challenges.",
  },
  {
    icon: MessageCircle,
    title: "Community",
    description:
      "Discuss setups, events, and technique with other racers — jump into discussions anytime.",
  },
  {
    icon: Bot,
    title: "Agent & Apex Pro",
    description:
      "Apex Agent uploads F1 25 telemetry automatically on Mac, Windows, and Linux — included with Apex Pro.",
  },
] as const;

export const BROWSE_LINKS = [
  {
    icon: MessageCircle,
    label: "Community",
    description: "Discussions on setups, events, and technique",
    to: "/v2/community",
  },
  {
    icon: Target,
    label: "Challenges",
    description: "Browse events and see who is competing",
    to: "/v2/challenges",
  },
  {
    icon: Trophy,
    label: "Leaderboards",
    description: "Lap times and rankings across sims",
    to: "/v2/leaderboards",
  },
] as const;

export const PRO_FEATURES = [
  { icon: Upload, label: "Automatic telemetry uploads" },
  { icon: Zap, label: "Apex Agent access" },
  { icon: BarChart3, label: "Full analytics & comparisons" },
  { icon: Trophy, label: "Future Pro-only challenges" },
] as const;

export type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};
