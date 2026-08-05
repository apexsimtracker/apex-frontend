import type { QueryClient } from "@tanstack/react-query";
import type { SessionsLibraryRow } from "@/lib/api/sessionsLibrary";
import type {
  ParsedSessionDetail,
  SessionDetail,
} from "@/features/session-detail/sessionDetailData";

export function sessionDetailQueryKey(id: string) {
  return ["sessions", "detail", id] as const;
}

type SessionDetailSeedInput = {
  id: string;
  createdAt: string;
  track: string;
  trackName?: string | null;
  car?: string | null;
  carName?: string | null;
  vehicleDisplay?: string | null;
  sim?: string | null;
  simKey?: string | null;
  sessionType?: string | null;
  manualSessionKind?: string | null;
  position?: number | null;
  qualifyingPosition?: number | null;
  totalDrivers?: number | null;
  bestLapMs?: number | null;
  lapCount?: number | null;
  caption?: string | null;
  source?: string | null;
  ingestSource?: string | null;
  userId?: string | null;
};

function seedPayloadFromInput(input: SessionDetailSeedInput): ParsedSessionDetail {
  const ingestRaw = (input.ingestSource ?? input.source ?? "")
    .toString()
    .trim()
    .toLowerCase();
  const ingestPath =
    ingestRaw === "manual_form" ||
    ingestRaw === "manual_upload_ibt" ||
    ingestRaw === "manual_upload_json" ||
    ingestRaw === "agent_upload"
      ? ingestRaw
      : ingestRaw === "manual"
        ? "manual_form"
        : ingestRaw === "agent"
          ? "agent_upload"
          : null;

  const session: SessionDetail = {
    id: input.id,
    track: input.track,
    trackName: input.trackName ?? null,
    car: input.vehicleDisplay ?? input.carName ?? input.car ?? null,
    carName: input.carName ?? null,
    vehicleDisplay: input.vehicleDisplay ?? undefined,
    sim: input.sim ?? input.simKey ?? null,
    sessionType: input.sessionType ?? null,
    manualSessionKind: input.manualSessionKind ?? null,
    position: input.position ?? null,
    qualifyingPosition: input.qualifyingPosition ?? null,
    totalDrivers: input.totalDrivers ?? null,
    bestLapMs: input.bestLapMs ?? null,
    lapCount: input.lapCount ?? null,
    caption: input.caption ?? null,
    source: input.source ?? input.ingestSource ?? null,
    ingestPath,
    userId: input.userId ?? null,
    // Omit laps so the page can tell seed vs hydrated detail.
  };
  return {
    session,
    proFeaturesLocked: false,
    apexAnalysis: { locked: false, insights: [] },
  };
}

/** Seed detail cache from a library / feed row so hero can paint immediately. */
export function seedSessionDetailFromListItem(
  queryClient: QueryClient,
  input: SessionDetailSeedInput,
): void {
  const key = sessionDetailQueryKey(input.id);
  if (queryClient.getQueryData(key)) return;
  queryClient.setQueryData(key, seedPayloadFromInput(input));
}

export function seedSessionDetailFromLibraryRow(
  queryClient: QueryClient,
  row: SessionsLibraryRow,
): void {
  seedSessionDetailFromListItem(queryClient, {
    id: row.id,
    createdAt: row.createdAt,
    track: row.track,
    trackName: row.trackName,
    car: row.car,
    carName: row.carName,
    sim: row.sim,
    simKey: row.simKey,
    sessionType: row.sessionType,
    manualSessionKind: row.manualSessionKind,
    position: row.position,
    qualifyingPosition: row.qualifyingPosition,
    totalDrivers: row.totalDrivers,
    bestLapMs: row.bestLapMs,
    lapCount: row.lapCount,
    caption: row.caption,
    source: row.source,
    ingestSource: row.ingestSource,
  });
}
