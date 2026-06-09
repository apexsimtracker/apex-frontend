/**
 * Activity feed sort — mirrors backend `apex/src/lib/sessionFeedSort.ts`.
 */

import {
  isQualifyingKind,
  isRaceKind,
  isPracticeKind,
  isWarmupKind,
} from "./sessionKind";

export type SessionFeedSortFields = {
  createdAt: string | Date;
  sessionType?: string | null;
  manualSessionKind?: string | null;
};

/** Lower number = higher in feed. Race=1, Qual=2, Practice=3, Warmup=4, other=5. */
export function getSessionFeedTypePriority(session: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}): number {
  if (isRaceKind(session)) return 1;
  if (isQualifyingKind(session)) return 2;
  if (isPracticeKind(session)) return 3;
  if (isWarmupKind(session)) return 4;
  return 5;
}

function utcDateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function compareSessionsForFeed(
  a: SessionFeedSortFields,
  b: SessionFeedSortFields
): number {
  const dateA = toDate(a.createdAt);
  const dateB = toDate(b.createdAt);
  const dayA = utcDateKey(dateA);
  const dayB = utcDateKey(dateB);
  if (dayA !== dayB) return dayB.localeCompare(dayA);

  const priA = getSessionFeedTypePriority(a);
  const priB = getSessionFeedTypePriority(b);
  if (priA !== priB) return priA - priB;

  return dateB.getTime() - dateA.getTime();
}

/** Best (lowest) feed priority among sessions in a bundle or single item. */
export function getActivityItemFeedPriority(sessions: SessionFeedSortFields[]): number {
  if (sessions.length === 0) return 5;
  return Math.min(...sessions.map((s) => getSessionFeedTypePriority(s)));
}

export function compareActivityItemsForFeed(
  aSessions: SessionFeedSortFields[],
  bSessions: SessionFeedSortFields[]
): number {
  const dateA = Math.max(...aSessions.map((s) => toDate(s.createdAt).getTime()));
  const dateB = Math.max(...bSessions.map((s) => toDate(s.createdAt).getTime()));
  const dayA = utcDateKey(new Date(dateA));
  const dayB = utcDateKey(new Date(dateB));
  if (dayA !== dayB) return dayB.localeCompare(dayA);

  const priA = getActivityItemFeedPriority(aSessions);
  const priB = getActivityItemFeedPriority(bSessions);
  if (priA !== priB) return priA - priB;

  return dateB - dateA;
}
