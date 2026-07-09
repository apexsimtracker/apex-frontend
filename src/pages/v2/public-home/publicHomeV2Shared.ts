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

export const cardClassName =
  "rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-6 sm:p-7";

export const gradientCardClassName =
  "rounded-xl border border-v2-outline-variant/15 bg-gradient-to-b from-v2-surface-container to-v2-background p-6 sm:p-8";

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
    featured: false,
  },
  {
    icon: BarChart3,
    title: "Sessions & stats",
    description:
      "Log performance and spot trends instead of scattering notes across spreadsheets.",
    featured: false,
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    description:
      "Compare laps and climb the ranks — see where you stand against the field.",
    featured: false,
  },
  {
    icon: Target,
    title: "Challenges",
    description:
      "Enter events, qualify, and compete in structured sim racing challenges.",
    featured: false,
  },
  {
    icon: MessageCircle,
    title: "Community",
    description:
      "Discuss setups, events, and technique with other racers — jump into discussions anytime.",
    featured: false,
  },
  {
    icon: Bot,
    title: "Agent & Apex Pro",
    description:
      "Download the Apex background agent for automatic F1 25 telemetry on macOS, Windows, and Linux, with broader sim support on Windows — available with Apex Pro on Pricing.",
    featured: true,
  },
] as const;

export const BROWSE_LINKS = [
  { icon: MessageCircle, label: "Community", to: "/v2/community" },
  { icon: Target, label: "Challenges", to: "/v2/challenges" },
  { icon: Trophy, label: "Leaderboards", to: "/v2/leaderboards" },
] as const;

export const PRO_FEATURES = [
  { icon: Upload, label: "Automatic telemetry uploads" },
  { icon: Zap, label: "Apex Agent access" },
  { icon: BarChart3, label: "Full analytics & comparisons" },
  { icon: Trophy, label: "Future Pro-only challenges" },
] as const;

export const HERO_STATS = [
  { value: "6", label: "hub features" },
  { value: "3", label: "sims" },
  { value: "Free", label: "to start" },
] as const;

export type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  featured: boolean;
};
