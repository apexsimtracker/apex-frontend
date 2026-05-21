import { fetchApi } from "./fetchClient";
import type { NotificationSeverity } from "./profile";

export type ActiveBroadcast = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  severity: NotificationSeverity;
  dismissible: boolean;
  createdAt: string;
};

export async function fetchActiveBroadcasts(): Promise<{
  broadcasts: ActiveBroadcast[];
}> {
  return fetchApi("GET", "/api/broadcasts/active", undefined, true);
}

export async function dismissBroadcast(id: string): Promise<{ ok: boolean }> {
  return fetchApi(
    "POST",
    `/api/broadcasts/${encodeURIComponent(id)}/dismiss`,
    {},
    true
  );
}

export async function pingBroadcastView(id: string): Promise<{ ok: boolean }> {
  return fetchApi(
    "POST",
    `/api/broadcasts/${encodeURIComponent(id)}/view`,
    {},
    true
  );
}
