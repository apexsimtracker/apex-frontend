import type { SessionVisibility } from "./api";

const STORAGE_KEY = "apex_settings";

export type InAppNotificationPrefs = {
  social: boolean;
  challenges: boolean;
  activity: boolean;
  account: boolean;
};

export const DEFAULT_IN_APP_NOTIFICATION_PREFS: InAppNotificationPrefs = {
  social: true,
  challenges: true,
  activity: true,
  account: true,
};

export type ApexSettings = {
  emailNotifications: boolean;
  showNotificationBadge: boolean;
  inAppNotificationPrefs: InAppNotificationPrefs;
  privateProfile: boolean;
  /** When private profile is on: require approval for new followers (synced with server). */
  manualFollowApproval: boolean;
  sessionVisibility: SessionVisibility;
};

export const DEFAULT_APEX_SETTINGS: ApexSettings = {
  emailNotifications: true,
  showNotificationBadge: true,
  inAppNotificationPrefs: { ...DEFAULT_IN_APP_NOTIFICATION_PREFS },
  privateProfile: false,
  manualFollowApproval: true,
  sessionVisibility: "PUBLIC",
};

function parseStored(raw: string | null): ApexSettings | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<ApexSettings> & {
      pushNotifications?: boolean;
      showRaceHistory?: boolean;
    };
    if (typeof data !== "object" || data === null) return null;
    const migratedVisibility: SessionVisibility | undefined =
      data.sessionVisibility ??
      (typeof data.showRaceHistory === "boolean"
        ? data.showRaceHistory
          ? "PUBLIC"
          : "PRIVATE"
        : undefined);

    const showNotificationBadge =
      typeof data.showNotificationBadge === "boolean"
        ? data.showNotificationBadge
        : typeof data.pushNotifications === "boolean"
          ? data.pushNotifications
          : DEFAULT_APEX_SETTINGS.showNotificationBadge;

    const prefsRaw = data.inAppNotificationPrefs as Partial<InAppNotificationPrefs> | undefined;
    const inAppNotificationPrefs: InAppNotificationPrefs = {
      social:
        typeof prefsRaw?.social === "boolean"
          ? prefsRaw.social
          : DEFAULT_IN_APP_NOTIFICATION_PREFS.social,
      challenges:
        typeof prefsRaw?.challenges === "boolean"
          ? prefsRaw.challenges
          : DEFAULT_IN_APP_NOTIFICATION_PREFS.challenges,
      activity:
        typeof prefsRaw?.activity === "boolean"
          ? prefsRaw.activity
          : DEFAULT_IN_APP_NOTIFICATION_PREFS.activity,
      account:
        typeof prefsRaw?.account === "boolean"
          ? prefsRaw.account
          : DEFAULT_IN_APP_NOTIFICATION_PREFS.account,
    };

    return {
      emailNotifications:
        data.emailNotifications ?? DEFAULT_APEX_SETTINGS.emailNotifications,
      showNotificationBadge,
      inAppNotificationPrefs,
      privateProfile:
        data.privateProfile ?? DEFAULT_APEX_SETTINGS.privateProfile,
      manualFollowApproval:
        data.manualFollowApproval ?? DEFAULT_APEX_SETTINGS.manualFollowApproval,
      sessionVisibility:
        migratedVisibility ?? DEFAULT_APEX_SETTINGS.sessionVisibility,
    };
  } catch {
    return null;
  }
}

export function getApexSettings(): ApexSettings {
  if (typeof localStorage === "undefined") return { ...DEFAULT_APEX_SETTINGS };
  const parsed = parseStored(localStorage.getItem(STORAGE_KEY));
  return parsed ?? { ...DEFAULT_APEX_SETTINGS };
}

export function setApexSettings(settings: ApexSettings): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resetApexSettings(): ApexSettings {
  const defaults = { ...DEFAULT_APEX_SETTINGS };
  setApexSettings(defaults);
  return defaults;
}
