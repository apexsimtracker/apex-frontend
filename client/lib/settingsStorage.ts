const STORAGE_KEY = "apex_settings";

export type ApexSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  activityNotifications: boolean;
  leaderboardNotifications: boolean;
  privateProfile: boolean;
  showRaceHistory: boolean;
};

export const DEFAULT_APEX_SETTINGS: ApexSettings = {
  emailNotifications: true,
  pushNotifications: true,
  activityNotifications: true,
  leaderboardNotifications: false,
  privateProfile: false,
  showRaceHistory: true,
};

function parseStored(raw: string | null): ApexSettings | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<ApexSettings>;
    if (typeof data !== "object" || data === null) return null;
    return {
      emailNotifications: data.emailNotifications ?? DEFAULT_APEX_SETTINGS.emailNotifications,
      pushNotifications: data.pushNotifications ?? DEFAULT_APEX_SETTINGS.pushNotifications,
      activityNotifications: data.activityNotifications ?? DEFAULT_APEX_SETTINGS.activityNotifications,
      leaderboardNotifications: data.leaderboardNotifications ?? DEFAULT_APEX_SETTINGS.leaderboardNotifications,
      privateProfile: data.privateProfile ?? DEFAULT_APEX_SETTINGS.privateProfile,
      showRaceHistory: data.showRaceHistory ?? DEFAULT_APEX_SETTINGS.showRaceHistory,
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
