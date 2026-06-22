import { useQuery } from "@tanstack/react-query";
import { fetchTelemetrySummary, fetchTelemetryTraces } from "./telemetryAnalysisApi";

export function useTelemetrySummary(sessionId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["sessions", "telemetry", "summary", sessionId ?? ""],
    queryFn: () => fetchTelemetrySummary(sessionId!),
    enabled: Boolean(sessionId) && enabled,
    staleTime: 60_000,
  });
}

export function useTelemetryTraces(
  sessionId: string | undefined,
  lapNumber: number | null,
  compareLapNumber: number | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: [
      "sessions",
      "telemetry",
      "traces",
      sessionId ?? "",
      lapNumber,
      compareLapNumber,
    ],
    queryFn: () =>
      fetchTelemetryTraces(sessionId!, lapNumber!, compareLapNumber),
    enabled: Boolean(sessionId) && enabled && lapNumber != null && lapNumber > 0,
    staleTime: 120_000,
  });
}
