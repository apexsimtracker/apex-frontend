/**
 * Session Grouping Utility
 * 
 * Groups sessions into "stacked activity" bundles when they share:
 * - Same sim (e.g., iRacing)
 * - Same track
 * - Same vehicle (if available)
 * - Start times within a rolling time window (default: 2 hours)
 * - Same calendar day
 * 
 * Tuning the time window:
 * - Increase TIME_WINDOW_MS for more aggressive grouping (e.g., 4 hours for endurance events)
 * - Decrease for stricter grouping (e.g., 1 hour for sprint races)
 * 
 * Sessions with missing track/vehicle metadata are NOT grouped (treated as standalone).
 * Bundles are capped at MAX_BUNDLE_SIZE (5) with overflow count.
 */

export const TIME_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
export const MAX_BUNDLE_SIZE = 5;

export type SessionItem = {
  id: string;
  driverName: string;
  track: string | null;
  car: string | null;
  vehicleDisplay?: string;
  position: number | null;
  totalDrivers: number | null;
  sessionType?: "PRACTICE" | "RACE" | "QUALIFY" | "UNKNOWN";
  sim?: string | null;
  bestLapMs?: number | null;
  bestLapLapNumber?: number | null;
  lapCount?: number;
  consistencyScore?: number | null;
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  createdAt: string | Date;
  source?: string | null;
  // Activity owner identity (from /api/activity)
  authorId?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  // Optional fields for aggregation
  iRatingChange?: number | null;
  incidentCount?: number | null;
  totalTimeMs?: number | null;
};

export type SingleActivity = {
  type: "single";
  session: SessionItem;
};

export type BundledActivity = {
  type: "bundle";
  sessions: SessionItem[];
  overflowCount: number; // Sessions beyond MAX_BUNDLE_SIZE
  groupKey: string;
};

export type ActivityItem = SingleActivity | BundledActivity;

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getGroupKey(session: SessionItem): string | null {
  const sim = session.sim?.trim().toLowerCase();
  const track = session.track?.trim().toLowerCase();
  const car = session.car?.trim().toLowerCase();
  
  // Sessions with missing metadata cannot be grouped
  if (!sim || !track || track === "unknown" || track.endsWith(".ibt")) {
    return null;
  }
  
  const date = new Date(session.createdAt);
  const dateKey = getDateKey(date);
  
  // Include car in group key if available, otherwise just sim+track
  const carPart = car && car !== "unknown" && car !== "—" ? car : "";
  return `${dateKey}:${sim}:${track}:${carPart}`;
}

function canMergeIntoGroup(
  existing: SessionItem[],
  candidate: SessionItem,
  timeWindowMs: number
): boolean {
  const candidateTime = new Date(candidate.createdAt).getTime();
  
  // Check if candidate is within time window of ANY session in the group
  for (const session of existing) {
    const sessionTime = new Date(session.createdAt).getTime();
    const diff = Math.abs(candidateTime - sessionTime);
    if (diff <= timeWindowMs) {
      return true;
    }
  }
  
  return false;
}

export function groupSessions(
  sessions: SessionItem[],
  options: { timeWindowMs?: number; maxBundleSize?: number } = {}
): ActivityItem[] {
  const timeWindowMs = options.timeWindowMs ?? TIME_WINDOW_MS;
  const maxBundleSize = options.maxBundleSize ?? MAX_BUNDLE_SIZE;
  
  if (!sessions || sessions.length === 0) {
    return [];
  }

  // Sort by createdAt descending (newest first) for stable ordering
  const sorted = [...sessions].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeB - timeA;
  });

  const result: ActivityItem[] = [];
  // Multiple groups can share the same base key but have different time clusters
  const groups: { key: string; sessions: SessionItem[] }[] = [];
  const processed = new Set<string>();

  for (const session of sorted) {
    if (processed.has(session.id)) continue;

    const groupKey = getGroupKey(session);
    
    // Sessions without valid group key are standalone
    if (!groupKey) {
      result.push({ type: "single", session });
      processed.add(session.id);
      continue;
    }

    // Check if we can add to an existing group with the same key AND within time window
    let addedToGroup = false;
    for (const group of groups) {
      if (group.key === groupKey && canMergeIntoGroup(group.sessions, session, timeWindowMs)) {
        group.sessions.push(session);
        addedToGroup = true;
        break;
      }
    }

    if (!addedToGroup) {
      // Start a new group
      groups.push({ key: groupKey, sessions: [session] });
    }
    processed.add(session.id);
  }

  // Convert groups to ActivityItems
  for (const group of groups) {
    if (group.sessions.length === 1) {
      result.push({ type: "single", session: group.sessions[0] });
    } else {
      // Sort group by time (oldest first for carousel navigation)
      const sortedGroup = group.sessions.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeA - timeB;
      });
      
      const displaySessions = sortedGroup.slice(0, maxBundleSize);
      const overflowCount = Math.max(0, sortedGroup.length - maxBundleSize);
      
      result.push({
        type: "bundle",
        sessions: displaySessions,
        overflowCount,
        groupKey: group.key,
      });
    }
  }

  // Sort result by most recent session in each item
  result.sort((a, b) => {
    const timeA = a.type === "single" 
      ? new Date(a.session.createdAt).getTime()
      : Math.max(...a.sessions.map(s => new Date(s.createdAt).getTime()));
    const timeB = b.type === "single"
      ? new Date(b.session.createdAt).getTime()
      : Math.max(...b.sessions.map(s => new Date(s.createdAt).getTime()));
    return timeB - timeA;
  });

  return result;
}

// Aggregation helpers for bundled stats
export function aggregateBundleStats(sessions: SessionItem[]) {
  const totalLaps = sessions.reduce((sum, s) => sum + (s.lapCount ?? 0), 0);
  
  const lapTimes = sessions
    .map(s => s.bestLapMs)
    .filter((ms): ms is number => ms != null && ms > 0);
  const bestLapMs = lapTimes.length > 0 ? Math.min(...lapTimes) : null;
  
  const avgLapMs = lapTimes.length > 0
    ? Math.round(lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length)
    : null;
  
  const totalTimeMs = sessions.reduce((sum, s) => sum + (s.totalTimeMs ?? 0), 0);
  
  const iRatingChanges = sessions
    .map(s => s.iRatingChange)
    .filter((ir): ir is number => ir != null);
  const totalIRatingChange = iRatingChanges.length > 0
    ? iRatingChanges.reduce((a, b) => a + b, 0)
    : null;
  
  const incidentCounts = sessions
    .map(s => s.incidentCount)
    .filter((inc): inc is number => inc != null);
  const totalIncidents = incidentCounts.length > 0
    ? incidentCounts.reduce((a, b) => a + b, 0)
    : null;
  
  // Time range
  const times = sessions.map(s => new Date(s.createdAt).getTime());
  const startTime = new Date(Math.min(...times));
  const endTime = new Date(Math.max(...times));
  
  return {
    count: sessions.length,
    totalLaps,
    bestLapMs,
    avgLapMs,
    totalTimeMs,
    totalIRatingChange,
    totalIncidents,
    startTime,
    endTime,
  };
}

export function getActivityKey(item: ActivityItem): string {
  if (item.type === "single") {
    return `single-${item.session.id}`;
  }
  return `bundle-${item.groupKey}`;
}
