import type { SessionItem } from "./sessionTypes";
import {
  isPracticeKind,
  isQualifyingKind,
} from "./sessionKind";

export type WeekendCarouselKind = "PRACTICE" | "QUALIFYING";

export type WeekendDisplaySegment =
  | { type: "single"; session: SessionItem }
  | { type: "carousel"; sessions: SessionItem[]; kind: WeekendCarouselKind };

function resolveCarouselKind(session: SessionItem): WeekendCarouselKind | null {
  if (isPracticeKind(session)) return "PRACTICE";
  if (isQualifyingKind(session)) return "QUALIFYING";
  return null;
}

/**
 * Collapse consecutive Practice or Qualifying sessions into carousel segments.
 * Race, warmup, and other kinds always render as single cards.
 * Input sessions must already be sorted Race → Qualifying → Practice (server order).
 */
export function segmentWeekendSessionsForDisplay(
  sessions: SessionItem[]
): WeekendDisplaySegment[] {
  if (!sessions.length) return [];

  const segments: WeekendDisplaySegment[] = [];
  let i = 0;

  while (i < sessions.length) {
    const session = sessions[i]!;
    const kind = resolveCarouselKind(session);

    if (!kind) {
      segments.push({ type: "single", session });
      i += 1;
      continue;
    }

    const bucket: SessionItem[] = [session];
    let j = i + 1;
    while (j < sessions.length && resolveCarouselKind(sessions[j]!) === kind) {
      bucket.push(sessions[j]!);
      j += 1;
    }

    if (bucket.length === 1) {
      segments.push({ type: "single", session: bucket[0]! });
    } else {
      segments.push({ type: "carousel", sessions: bucket, kind });
    }
    i = j;
  }

  return segments;
}
