import { useQuery } from "@tanstack/react-query";
import { getActivityFeedPage, type ActivityFeedItem } from "@/lib/api";
import { getSimDisplayName } from "@/lib/sim";

export type RecentManualItem = {
  sim: string;
  trackId: string;
  trackName: string;
  carId: string | null;
  carName: string;
  /** Dedupe key */
  key: string;
};

type ActivitySession = {
  id?: string;
  sim?: string | null;
  simKey?: string | null;
  track?: string | null;
  trackId?: string | null;
  trackName?: string | null;
  car?: string | null;
  carId?: string | null;
  carName?: string | null;
  vehicleDisplay?: string | null;
  source?: string | null;
  sessionType?: string | null;
  createdAt?: string | Date;
};

const RECENT_LIMIT = 5;
/** API page size for recent manual rows (deduped to RECENT_LIMIT in UI). */
const RECENT_FEED_FETCH_LIMIT = 10;

function normalizeSim(s: string | null | undefined): string {
  if (!s || !s.trim()) return "";
  return s.trim().toUpperCase();
}

/** Flatten grouped activity feed items into individual session records. */
export function flattenFeedSessions(items: unknown[]): ActivitySession[] {
  const sessions: ActivitySession[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;

    if (rec.type === "standalone" && rec.session) {
      sessions.push(rec.session as ActivitySession);
      continue;
    }

    if (rec.type === "weekend" && rec.group && typeof rec.group === "object") {
      const group = rec.group as Record<string, unknown>;
      const groupSessions = Array.isArray(group.sessions) ? group.sessions : [];
      for (const session of groupSessions) {
        if (session && typeof session === "object") {
          sessions.push(session as ActivitySession);
        }
      }
      continue;
    }

    // Backward compat: treat unknown shapes as flat session rows.
    sessions.push(item as ActivitySession);
  }

  return sessions;
}

function sessionToRecentItem(s: ActivitySession): RecentManualItem | null {
  const sim = normalizeSim((s.simKey ?? s.sim) as string | null | undefined);
  if (!sim) return null;

  const trackId = (s.trackId ?? s.track ?? "").toString().trim();
  const trackName =
    (s.trackName ?? s.track ?? "").toString().trim() || trackId;
  const carId = (s.carId ?? s.car ?? "").toString().trim() || null;
  const carName =
    (s.vehicleDisplay ?? s.carName ?? s.car ?? "").toString().trim() || "—";

  if (!trackId && !trackName) return null;

  return {
    sim,
    trackId: trackId || trackName,
    trackName,
    carId,
    carName,
    key: `${sim}|${trackId || trackName}|${carId ?? ""}`,
  };
}

function buildRecentFromFeed(): Promise<RecentManualItem[]> {
  return getActivityFeedPage({
    type: "manual",
    page: 1,
    limit: RECENT_FEED_FETCH_LIMIT,
  }).then(({ items }) => {
    const sessions = flattenFeedSessions(
      Array.isArray(items) ? (items as ActivityFeedItem[]) : [],
    );

    const seen = new Set<string>();
    const out: RecentManualItem[] = [];

    for (const s of sessions) {
      const item = sessionToRecentItem(s);
      if (!item) continue;
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      out.push(item);
      if (out.length >= RECENT_LIMIT) break;
    }

    return out;
  });
}

export function useRecentManualSessions(options?: {
  enabled?: boolean;
}): {
  recent: RecentManualItem[];
  loading: boolean;
  refetch: () => void;
} {
  const enabled = options?.enabled ?? true;

  const {
    data: recent = [],
    isPending: loading,
    refetch,
  } = useQuery({
    queryKey: ["activity", "recent-manual"],
    queryFn: buildRecentFromFeed,
    enabled,
  });

  return {
    recent,
    loading: enabled ? loading : false,
    refetch: () => {
      void refetch();
    },
  };
}

export function getRecentChipLabel(item: RecentManualItem): string {
  const simLabel = getSimDisplayName(item.sim);
  const parts = [simLabel, item.trackName];
  if (item.carName && item.carName !== "—") parts.push(item.carName);
  return parts.join(" • ");
}
