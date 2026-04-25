import type { SessionVisibility } from "@/lib/api";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";

export const SETTINGS_PATH = "/settings";
export const settingsTitle = `Settings | ${COMPANY_NAME}`;
export const settingsDescription = `Account, password, preferences, and privacy settings for your ${COMPANY_NAME} profile at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

export const PRIMARY_RED = "rgb(240, 28, 28)";
export const DELETE_CONFIRM_PHRASE = "DELETE";

export const SESSION_VISIBILITY_OPTIONS: {
  value: SessionVisibility;
  title: string;
  description: string;
}[] = [
  {
    value: "PUBLIC",
    title: "Everyone",
    description:
      "Anyone with a session link can open session details. Race history follows your profile visibility (public profiles are open to all).",
  },
  {
    value: "FOLLOWERS_ONLY",
    title: "Followers only",
    description:
      "Only approved followers can open your session links and see race history when they can view your profile.",
  },
  {
    value: "PRIVATE",
    title: "Only me",
    description:
      "Only you can view your race history and session detail pages; others receive an access denied message.",
  },
];
