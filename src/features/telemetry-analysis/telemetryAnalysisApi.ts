import { apiGet } from "@/lib/api";
import type {
  TelemetrySummaryResponse,
  TelemetryTracesResponse,
} from "./types";

export async function fetchTelemetrySummary(
  sessionId: string,
): Promise<TelemetrySummaryResponse> {
  return apiGet<TelemetrySummaryResponse>(
    `/api/sessions/${sessionId}/telemetry?view=summary`,
  );
}

export async function fetchTelemetryTraces(
  sessionId: string,
  lapNumber: number,
  compareLapNumber?: number | null,
): Promise<TelemetryTracesResponse> {
  const params = new URLSearchParams({ lap: String(lapNumber) });
  if (compareLapNumber != null && compareLapNumber !== lapNumber) {
    params.set("compare", String(compareLapNumber));
  }
  return apiGet<TelemetryTracesResponse>(
    `/api/sessions/${sessionId}/telemetry?${params.toString()}`,
  );
}
