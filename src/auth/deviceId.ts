/** Stable per-browser id for web session / risk grouping (localStorage). */
export const APEX_DEVICE_ID_KEY = "apex_device_id";

export function getOrCreateDeviceId(): string {
  if (typeof localStorage === "undefined") return "";
  try {
    let id = localStorage.getItem(APEX_DEVICE_ID_KEY);
    if (!id?.trim()) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `dev_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
      localStorage.setItem(APEX_DEVICE_ID_KEY, id);
    }
    return id.trim();
  } catch {
    return "";
  }
}
