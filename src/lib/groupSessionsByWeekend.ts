/**
 * Race weekend grouping for activity feeds (Fix 5).
 * Groups sessions by author + track + car within a 48-hour window; breaks after P+Q+R cycle.
 *
 * @deprecated Feed pages use server-side grouping from GET /api/activity. Kept for unit tests only.
 */

import { formatTrackName } from "./tracks";
import { formatCarName } from "./utils";
import {
  isPracticeKind,
  isQualifyingKind,
  isRaceKind,
  isWarmupKind,
} from "./sessionKind";
import type { SessionItem } from "./groupSessions";

export const WEEKEND_WINDOW_MS = 48 * 60 * 60 * 1000;

export type WeekendGroup = {
  /** Normalized canonical track key (formatTrackName lowercased) for stable grouping/keys. */
  trackKey: string;
  trackName: string;
  date: string;
  sessions: SessionItem[];
  hasRace: boolean;
  hasQualifying: boolean;
  hasPractice: boolean;
  lastSessionAt: string;
  weekendSummary: string;
  authorId: string;
};

export type WeekendFeedItem =
  | { type: "weekend"; group: WeekendGroup }
  | { type: "standalone"; session: SessionItem };

type MutableWeekendGroup = {
  trackKey: string;
  trackName: string;
  authorId: string;
  sessions: SessionItem[];
  hasRace: boolean;
  hasQualifying: boolean;
  hasPractice: boolean;
  lastSessionAt: number;
  earliestSessionAt: number;
};

function toTimestamp(value: string | Date): number {
  const d = value instanceof Date ? value : new Date(value);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

function resolveTrackRaw(session: SessionItem): string | null {
  const fromApi =
    typeof session.trackName === "string" && session.trackName.trim()
      ? session.trackName.trim()
      : null;
  if (fromApi) return fromApi;
  const raw = session.track?.trim() || session.trackName?.trim();
  return raw || null;
}

/** Canonical track key for grouping — merges aliases like spa / Spa-Francorchamps. */
export function normalizeTrackKeyForWeekend(session: SessionItem): string | null {
  const raw = resolveTrackRaw(session);
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === "unknown" || lower.endsWith(".ibt")) return null;
  return formatTrackName(raw).trim().toLowerCase();
}

function resolveCarRaw(session: SessionItem): string | null {
  const fromCarName =
    typeof session.carName === "string" && session.carName.trim()
      ? session.carName.trim()
      : null;
  if (fromCarName) return fromCarName;
  const fromDisplay =
    typeof session.vehicleDisplay === "string" && session.vehicleDisplay.trim()
      ? session.vehicleDisplay.trim()
      : null;
  if (fromDisplay) return fromDisplay;
  const raw = session.car?.trim();
  return raw || null;
}

/** Canonical car key for grouping — merges display aliases when possible. */
export function normalizeCarKeyForWeekend(session: SessionItem): string | null {
  const raw = resolveCarRaw(session);
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === "unknown" || lower === "—") return null;
  return formatCarName(raw).trim().toLowerCase();
}

function resolveAuthorId(session: SessionItem): string | null {
  const fromAuthor =
    typeof session.authorId === "string" && session.authorId.trim()
      ? session.authorId.trim()
      : null;
  if (fromAuthor) return fromAuthor;

  const owner = (session as SessionItem & { owner?: { id?: string | null } }).owner;
  if (owner && typeof owner.id === "string" && owner.id.trim()) {
    return owner.id.trim();
  }
  return null;
}

function isWeekendConcluded(group: MutableWeekendGroup): boolean {
  return group.hasRace;
}

function updateKindFlags(group: MutableWeekendGroup, session: SessionItem): void {
  if (isRaceKind(session)) group.hasRace = true;
  if (isQualifyingKind(session)) group.hasQualifying = true;
  if (isPracticeKind(session)) group.hasPractice = true;
}

function buildWeekendSummary(group: MutableWeekendGroup): string {
  const parts: string[] = [];
  if (group.hasPractice) parts.push("Practice");
  if (group.hasQualifying) parts.push("Qualifying");
  if (group.hasRace) parts.push("Race");
  return parts.join(" · ");
}

function formatWeekendDate(earliestMs: number): string {
  const d = new Date(earliestMs);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Race → Qualifying → Practice → Warmup → other; tie-break by latest start time. */
function getWithinWeekendSortPriority(session: SessionItem): number {
  if (isRaceKind(session)) return 1;
  if (isQualifyingKind(session)) return 2;
  if (isPracticeKind(session)) return 3;
  if (isWarmupKind(session)) return 4;
  return 5;
}

export function sortSessionsWithinWeekend(sessions: SessionItem[]): SessionItem[] {
  return [...sessions].sort((a, b) => {
    const priA = getWithinWeekendSortPriority(a);
    const priB = getWithinWeekendSortPriority(b);
    if (priA !== priB) return priA - priB;
    return toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
  });
}

function finalizeGroup(group: MutableWeekendGroup): WeekendGroup {
  const sorted = sortSessionsWithinWeekend(group.sessions);
  return {
    trackKey: group.trackKey,
    trackName: group.trackName,
    date: formatWeekendDate(group.earliestSessionAt),
    sessions: sorted,
    hasRace: group.hasRace,
    hasQualifying: group.hasQualifying,
    hasPractice: group.hasPractice,
    lastSessionAt: new Date(group.lastSessionAt).toISOString(),
    weekendSummary: buildWeekendSummary(group),
    authorId: group.authorId,
  };
}

function createMutableGroup(
  session: SessionItem,
  authorId: string,
  trackKey: string
): MutableWeekendGroup {
  const sessionTime = toTimestamp(session.createdAt);
  const group: MutableWeekendGroup = {
    trackKey,
    trackName: formatTrackName(resolveTrackRaw(session)),
    authorId,
    sessions: [session],
    hasRace: false,
    hasQualifying: false,
    hasPractice: false,
    lastSessionAt: sessionTime,
    earliestSessionAt: sessionTime,
  };
  updateKindFlags(group, session);
  return group;
}

function addToMutableGroup(group: MutableWeekendGroup, session: SessionItem): void {
  const sessionTime = toTimestamp(session.createdAt);
  group.sessions.push(session);
  group.lastSessionAt = Math.max(group.lastSessionAt, sessionTime);
  group.earliestSessionAt = Math.min(group.earliestSessionAt, sessionTime);
  updateKindFlags(group, session);
}

export function groupSessionsByWeekend(sessions: SessionItem[]): WeekendFeedItem[] {
  if (!sessions || sessions.length === 0) return [];

  const sortedAsc = [...sessions].sort(
    (a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
  );

  const openGroups = new Map<string, MutableWeekendGroup>();
  const allGroups: MutableWeekendGroup[] = [];
  const standalones: SessionItem[] = [];

  for (const session of sortedAsc) {
    const authorId = resolveAuthorId(session);
    const trackKey = normalizeTrackKeyForWeekend(session);
    const carKey = normalizeCarKeyForWeekend(session);

    if (!authorId || !trackKey || !carKey) {
      standalones.push(session);
      continue;
    }

    const mapKey = `${authorId}:${trackKey}:${carKey}`;
    const sessionTime = toTimestamp(session.createdAt);
    const open = openGroups.get(mapKey);

    if (
      open &&
      !isWeekendConcluded(open) &&
      sessionTime - open.lastSessionAt <= WEEKEND_WINDOW_MS
    ) {
      addToMutableGroup(open, session);
    } else {
      const newGroup = createMutableGroup(session, authorId, trackKey);
      openGroups.set(mapKey, newGroup);
      allGroups.push(newGroup);
    }
  }

  const items: WeekendFeedItem[] = [];

  for (const g of allGroups) {
    if (g.sessions.length === 1) {
      items.push({ type: "standalone", session: g.sessions[0]! });
    } else {
      items.push({
        type: "weekend" as const,
        group: finalizeGroup(g),
      });
    }
  }

  for (const session of standalones) {
    items.push({ type: "standalone", session });
  }

  items.sort((a, b) => {
    const timeA =
      a.type === "weekend"
        ? toTimestamp(a.group.lastSessionAt)
        : toTimestamp(a.session.createdAt);
    const timeB =
      b.type === "weekend"
        ? toTimestamp(b.group.lastSessionAt)
        : toTimestamp(b.session.createdAt);
    return timeB - timeA;
  });

  return items;
}

export function getWeekendFeedItemKey(item: WeekendFeedItem): string {
  if (item.type === "standalone") return `standalone-${item.session.id}`;
  const g = item.group;
  return `weekend-${g.authorId}-${g.trackKey}-${g.lastSessionAt}`;
}
