import { apiGet } from "./httpVerbs";

export type SessionsLibraryTypeFilter = "all" | "telemetry" | "manual";
export type SessionsLibrarySessionKind =
  | "all"
  | "practice"
  | "qualify"
  | "race";
export type SessionsLibraryIngest =
  | "all"
  | "manual_form"
  | "agent_upload"
  | "manual_upload_ibt";
export type SessionsLibrarySort = "newest" | "oldest" | "bestLap";
export type SessionsLibraryStatsTab =
  | "overview"
  | "weekly"
  | "racing"
  | "bySim";
export type SessionsLibraryView = "cards" | "table";

export type SessionsLibraryFilters = {
  type?: SessionsLibraryTypeFilter;
  sessionKind?: SessionsLibrarySessionKind;
  sim?: string;
  ingest?: SessionsLibraryIngest;
  q?: string;
  sort?: SessionsLibrarySort;
};

export type SessionsLibraryRow = {
  id: string;
  createdAt: string;
  sim: string;
  simKey: string;
  track: string;
  trackName: string | null;
  car: string | null;
  carName: string | null;
  sessionType: string;
  manualSessionKind: string | null;
  ingestSource: string | null;
  source: string;
  position: number | null;
  qualifyingPosition: number | null;
  totalDrivers: number | null;
  showPosition: boolean;
  lapCount: number;
  bestLapMs: number | null;
  totalTimeMs: number | null;
  caption: string | null;
};

export type SessionsLibraryOverview = {
  totalSessions: number;
  totalLaps: number;
  trackTimeSec: number;
  streakDays: number;
};

export type SessionsLibraryFilterCounts = {
  byType: { all: number; telemetry: number; manual: number };
  bySessionKind: {
    all: number;
    practice: number;
    qualify: number;
    race: number;
  };
  bySim: { iracing: number; f1_25: number; lmu: number };
  byIngest: {
    all: number;
    manual_form: number;
    agent_upload: number;
    manual_upload_ibt: number;
  };
};

export type SessionsLibraryMeta = {
  filterCounts: SessionsLibraryFilterCounts;
  overview: SessionsLibraryOverview;
  historyLimited: boolean;
};

export type SessionsLibraryListResult = {
  items: SessionsLibraryRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  historyLimited: boolean;
};

export type SessionsLibraryRacingStats = {
  tab: "racing";
  races: number;
  wins: number | null;
  podiums: number | null;
  poles: number | null;
  totalLaps: number;
  /** @deprecated Alias of totalLaps during API rollout. */
  fastestLaps?: number;
  avgFinish: number | null;
  historyLimited: boolean;
};

export type SessionsLibraryWeeklyStats = {
  tab: "weekly";
  weeklySnapshot: {
    weekStart: string;
    weekEnd: string;
    sessions: number;
    sessionsDelta: number;
    trackTimeSec: number;
    trackTimeSecDelta: number;
    laps: number;
    lapsDelta: number;
  };
  weeklyGoals: {
    races: { current: number; target: number };
    podiums: { current: number; target: number };
    laps: { current: number; target: number };
  };
  historyLimited: boolean;
};

export type SessionsLibraryBySimStats = {
  tab: "bySim";
  statsByGame: Array<{
    sim: string;
    simKey?: string;
    races: number;
    wins: number | null;
    podiums: number | null;
    poles: number | null;
    totalLaps: number;
    /** @deprecated Alias of totalLaps during API rollout. */
    fastestLaps?: number;
    winPct: number | null;
    podiumPct: number | null;
  }>;
  historyLimited: boolean;
};

export type SessionsLibraryOverviewStats = {
  tab: "overview";
  overview: SessionsLibraryOverview;
  historyLimited: boolean;
};

export type SessionsLibraryStatsResult =
  | SessionsLibraryOverviewStats
  | SessionsLibraryWeeklyStats
  | SessionsLibraryRacingStats
  | SessionsLibraryBySimStats;

export const SESSIONS_LIBRARY_DEFAULT_LIMIT = 12;

function buildQuery(
  params: SessionsLibraryFilters & {
    page?: number;
    limit?: number;
    tab?: SessionsLibraryStatsTab;
  },
): string {
  const sp = new URLSearchParams();
  if (params.type && params.type !== "all") sp.set("type", params.type);
  if (params.sessionKind && params.sessionKind !== "all") {
    sp.set("sessionKind", params.sessionKind);
  }
  if (params.sim) sp.set("sim", params.sim);
  if (params.ingest && params.ingest !== "all") sp.set("ingest", params.ingest);
  if (params.q) sp.set("q", params.q);
  if (params.sort && params.sort !== "newest") sp.set("sort", params.sort);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.tab) sp.set("tab", params.tab);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function getSessionsLibraryMeta(
  params: SessionsLibraryFilters = {},
): Promise<SessionsLibraryMeta> {
  return apiGet<SessionsLibraryMeta>(
    `/api/sessions/library/meta${buildQuery(params)}`,
  );
}

export async function getSessionsLibraryList(
  params: SessionsLibraryFilters & { page?: number; limit?: number } = {},
): Promise<SessionsLibraryListResult> {
  return apiGet<SessionsLibraryListResult>(
    `/api/sessions/library${buildQuery({
      ...params,
      page: params.page ?? 1,
      limit: params.limit ?? SESSIONS_LIBRARY_DEFAULT_LIMIT,
    })}`,
  );
}

export async function getSessionsLibraryStats(
  tab: SessionsLibraryStatsTab,
  params: SessionsLibraryFilters = {},
): Promise<SessionsLibraryStatsResult> {
  return apiGet<SessionsLibraryStatsResult>(
    `/api/sessions/library/stats${buildQuery({ ...params, tab })}`,
  );
}
