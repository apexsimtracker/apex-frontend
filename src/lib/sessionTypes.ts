/** Shared feed row type for activity/session cards and weekend display helpers. */
export type SessionItem = {
  id: string;
  driverName: string;
  track: string | null;
  /** Display track label from API; used as fallback when grouping canonicalizes aliases. */
  trackName?: string | null;
  car: string | null;
  carName?: string | null;
  vehicleDisplay?: string;
  position: number | null;
  qualifyingPosition?: number | null;
  totalDrivers: number | null;
  sessionType?:
    | "PRACTICE"
    | "RACE"
    | "SPRINT"
    | "QUALIFY"
    | "QUALIFYING"
    | "WARMUP"
    | "TIME_TRIAL"
    | "TIMETRIAL"
    | "UNKNOWN"
    | "MANUAL_ACTIVITY";
  /** Present for MANUAL_ACTIVITY rows from API (Practice / Qualifying / Race). */
  manualSessionKind?: string | null;
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
  /** Gated Apex Analysis insights from home feed (Pro viewers only). */
  apexAnalysis?: { locked: false; insights: string[] } | null;
};
