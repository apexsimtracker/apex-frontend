import { useState, useEffect, useCallback } from "react";
import { getActivityFeedPage } from "@/lib/api";
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
  car?: string | null;
  carId?: string | null;
  vehicleDisplay?: string | null;
  source?: string | null;
  sessionType?: string | null;
  createdAt?: string | Date;
};

const RECENT_LIMIT = 5;

function normalizeSim(s: string | null | undefined): string {
  if (!s || !s.trim()) return "";
  return s.trim().toUpperCase();
}

export function useRecentManualSessions(): {
  recent: RecentManualItem[];
  loading: boolean;
  refetch: () => void;
} {
  const [recent, setRecent] = useState<RecentManualItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await getActivityFeedPage({
        type: "manual",
        page: 1,
        limit: 50,
      });
      const sessions = (Array.isArray(items) ? items : []) as ActivitySession[];

      const seen = new Set<string>();
      const out: RecentManualItem[] = [];

      for (const s of sessions) {
        const sim = normalizeSim((s.simKey ?? s.sim) as string | null | undefined);
        if (!sim) continue;
        const trackId = (s.trackId ?? s.track ?? "").toString().trim();
        const trackName = (s.track ?? "").toString().trim() || trackId;
        const carId = (s.carId ?? "").toString().trim() || null;
        const carName = (s.vehicleDisplay ?? s.car ?? "").toString().trim() || "—";

        const key = `${sim}|${trackId}|${carId ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (!trackId && !trackName) continue;

        out.push({
          sim,
          trackId: trackId || trackName,
          trackName,
          carId,
          carName,
          key,
        });
        if (out.length >= RECENT_LIMIT) break;
      }

      setRecent(out);
    } catch {
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecent();
  }, [fetchRecent]);

  return { recent, loading, refetch: fetchRecent };
}

export function getRecentChipLabel(item: RecentManualItem): string {
  const simLabel = getSimDisplayName(item.sim);
  const parts = [simLabel, item.trackName];
  if (item.carName && item.carName !== "—") parts.push(item.carName);
  return parts.join(" • ");
}
