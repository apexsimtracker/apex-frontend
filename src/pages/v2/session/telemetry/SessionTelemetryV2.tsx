import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Maximize2 } from "lucide-react";
import { formatLapMs, cn } from "@/lib/utils";
import { useIsProUser } from "@/contexts/AuthContext";
import {
  useTelemetrySummary,
  useTelemetryTraces,
} from "@/features/telemetry-analysis/useSessionTelemetry";
import {
  isAgentOnlyTelemetryGate,
  telemetryIngestSourceLabel,
} from "@/features/telemetry-analysis/telemetryEligibility";
import type {
  TelemetrySummaryResponse,
  TelemetryTracesResponse,
} from "@/features/telemetry-analysis/types";
import type { NormalizedLap } from "@/features/session-detail/sessionDetailData";
import SessionTelemetryChartsV2 from "./SessionTelemetryChartsV2";
import TelemetryLapPickerV2 from "./TelemetryLapPickerV2";
import FullTelemetryModalV2, {
  type SectorLapTimes,
} from "./FullTelemetryModalV2";

const SECTION = "rounded-xl bg-v2-surface-container-low p-4 shadow-lg";

type SessionTelemetryV2Props = {
  sessionId: string;
  ingestPath?: string | null;
  laps: NormalizedLap[];
  selectedLap: number | null;
  onSelectLap: (lapNumber: number) => void;
  bestLapLapNumber?: number | null;
};

type TabId = "driving" | "fuel" | "tyres";

export default function SessionTelemetryV2({
  sessionId,
  ingestPath,
  laps,
  selectedLap,
  onSelectLap,
  bestLapLapNumber,
}: SessionTelemetryV2Props) {
  const isPro = useIsProUser();
  const agentOnlyGate = isAgentOnlyTelemetryGate(ingestPath);
  const [tab, setTab] = useState<TabId>("driving");
  const [compareLap, setCompareLap] = useState<number | null>(null);
  const [fullOpen, setFullOpen] = useState(false);

  const {
    data: summary,
    isLoading,
    isError,
  } = useTelemetrySummary(sessionId, isPro && !agentOnlyGate);

  useEffect(() => {
    if (selectedLap != null) return;
    const defaultCandidate =
      summary?.defaultLapNumber ??
      summary?.laps.find((l) => l.isBestLap && !l.isOutLap)?.lapNumber ??
      bestLapLapNumber ??
      null;
    if (defaultCandidate != null) onSelectLap(defaultCandidate);
  }, [
    selectedLap,
    summary?.defaultLapNumber,
    summary?.laps,
    bestLapLapNumber,
    onSelectLap,
  ]);

  useEffect(() => {
    if (compareLap != null && compareLap === selectedLap) {
      setCompareLap(null);
    }
  }, [compareLap, selectedLap]);

  const canLoadTraces = Boolean(
    isPro &&
      summary?.eligible &&
      summary.hasProAccess &&
      selectedLap != null &&
      summary.laps.some((l) => l.lapNumber === selectedLap && l.hasTraces),
  );

  const { data: traces, isLoading: tracesLoading, isError: tracesError } =
    useTelemetryTraces(
      sessionId,
      selectedLap,
      compareLap,
      canLoadTraces && tab === "driving",
    );

  const paceLaps = useMemo(
    () =>
      laps.filter(
        (l) => l.timeMs > 0 && l.isValid !== false && l.isOutLap !== true,
      ),
    [laps],
  );

  const sectorTimes = useMemo<SectorLapTimes[]>(
    () =>
      laps.map((l) => ({
        lap: l.lap,
        timeMs: l.timeMs,
        sector1Ms: l.sector1Ms,
        sector2Ms: l.sector2Ms,
        sector3Ms: l.sector3Ms,
      })),
    [laps],
  );

  if (!isPro) {
    return (
      <section
        className={`${SECTION} text-center`}
        data-testid="telemetry-pro-gate"
      >
        <h3 className="font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
          Telemetry Analysis
        </h3>
        <p className="mt-2 font-v2-body text-sm text-v2-on-surface-variant">
          Unlock driving traces, fuel strategy, and tyre insights with Apex Pro.
        </p>
        <Link
          to="/v2/pricing"
          className="text-v2-on-primary mt-4 inline-flex rounded-full bg-v2-primary px-4 py-2 font-v2-body text-xs font-bold uppercase tracking-widest"
        >
          Upgrade to Pro
        </Link>
      </section>
    );
  }

  if (agentOnlyGate) {
    return (
      <section
        className={`${SECTION} text-center`}
        data-testid="telemetry-agent-gate"
      >
        <h3 className="font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
          Telemetry Analysis
        </h3>
        <p className="mt-2 font-v2-body text-sm text-v2-on-surface-variant">
          Manual form and JSON uploads store lap times only. Install the Apex
          Agent or upload an .ibt file to capture driving traces, fuel, and tyre
          data.
        </p>
        <Link
          to="/v2/agent"
          className="mt-4 inline-flex rounded-full border border-v2-outline-variant/30 px-4 py-2 font-v2-body text-xs font-bold uppercase tracking-widest text-v2-on-surface"
        >
          Get Apex Agent
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className={SECTION} data-testid="telemetry-loading">
        <h3 className="mb-3 font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
          Telemetry Analysis
        </h3>
        <div className="h-40 animate-pulse rounded-lg bg-v2-surface-container" />
      </section>
    );
  }

  if (isError || !summary) {
    return (
      <section className={SECTION} data-testid="telemetry-error">
        <h3 className="font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
          Telemetry Analysis
        </h3>
        <p className="mt-2 font-v2-body text-sm text-v2-error">
          Unable to load telemetry for this session.
        </p>
      </section>
    );
  }

  if (!summary.eligible) {
    return (
      <section className={SECTION} data-testid="telemetry-ineligible">
        <h3 className="font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
          Telemetry Analysis
        </h3>
        <p className="mt-2 font-v2-body text-sm text-v2-on-surface-variant">
          {summary.eligibilityReason === "NO_DATA"
            ? "No driving telemetry is available for this session yet."
            : "Telemetry analysis is not available for this session."}
        </p>
      </section>
    );
  }

  const sourceLabel = telemetryIngestSourceLabel(ingestPath);
  const hasFuel = (summary.fuel?.perLap.length ?? 0) > 0;
  const hasTyres = (summary.tyres?.perLap.length ?? 0) > 0;
  const tabItems = (
    [
      ["driving", "Driving", true],
      ["fuel", "Fuel", hasFuel],
      ["tyres", "Tyres", hasTyres],
    ] as const
  ).filter(([, , enabled]) => enabled);

  return (
    <div className="space-y-4" data-testid="session-telemetry-v2">
      <LapPaceProgressionV2
        laps={paceLaps}
        bestLapLapNumber={bestLapLapNumber}
        selectedLap={selectedLap}
      />

      <section className={SECTION}>
        <div className="mb-3 space-y-3">
          <div>
            <h3 className="font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
              Telemetry Analysis
            </h3>
            <p className="mt-0.5 font-v2-body text-[11px] text-v2-on-surface-variant">
              {sourceLabel}
              {summary.simKey ? ` · ${summary.simKey}` : ""}
            </p>
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Telemetry views"
          >
            {tabItems.map(([id, label]) => {
              const isActive = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTab(id)}
                  className={cn(
                    "shrink-0 rounded-v2-sm px-4 py-2 font-v2-body text-xs font-bold transition-colors",
                    isActive
                      ? "bg-v2-primary text-white"
                      : "bg-v2-surface-container-low text-v2-on-surface-variant hover:text-v2-on-surface",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === "driving" && (
          <div className="space-y-4" role="tabpanel">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <TelemetryLapPickerV2
                  laps={summary.laps}
                  selectedLap={selectedLap}
                  compareLap={compareLap}
                  onSelectLap={onSelectLap}
                  onSelectCompare={setCompareLap}
                />
              </div>
              {traces && (
                <button
                  type="button"
                  onClick={() => setFullOpen(true)}
                  className="group flex shrink-0 items-center gap-2 self-end rounded-v2-sm border border-v2-outline-variant/25 bg-v2-surface-container-high px-3.5 py-2.5 font-v2-body text-xs font-bold text-v2-on-surface transition-all hover:border-v2-primary/50 hover:bg-v2-surface-container-highest"
                  data-testid="open-full-telemetry-v2"
                >
                  <Maximize2
                    className="size-4 text-v2-primary transition-transform group-hover:scale-110"
                    aria-hidden
                  />
                  <span className="hidden sm:inline">View Full Telemetry</span>
                  <span className="sm:hidden">Full</span>
                </button>
              )}
            </div>
            {tracesLoading ? (
              <div className="h-48 animate-pulse rounded-lg bg-v2-surface-container" />
            ) : tracesError ? (
              <p className="font-v2-body text-sm text-v2-error">
                Failed to load driving traces for this lap.
              </p>
            ) : traces ? (
              <SessionTelemetryChartsV2 traces={traces} />
            ) : (
              <p className="font-v2-body text-sm text-v2-on-surface-variant">
                Select a lap with traces to view driver inputs.
              </p>
            )}
            {traces && (
              <FullTelemetryModalV2
                isOpen={fullOpen}
                onClose={() => setFullOpen(false)}
                sessionId={sessionId}
                traces={traces}
                laps={summary.laps}
                selectedLap={selectedLap}
                compareLap={compareLap}
                onSelectLap={onSelectLap}
                onSelectCompare={setCompareLap}
                sectorTimes={sectorTimes}
              />
            )}
          </div>
        )}

        {tab === "fuel" && (
          <div role="tabpanel">
            <FuelPanelV2 summary={summary} />
          </div>
        )}

        {tab === "tyres" && (
          <div role="tabpanel">
            <TyresPanelV2 summary={summary} selectedLap={selectedLap} />
          </div>
        )}
      </section>
    </div>
  );
}

function LapPaceProgressionV2({
  laps,
  bestLapLapNumber,
  selectedLap,
}: {
  laps: NormalizedLap[];
  bestLapLapNumber?: number | null;
  selectedLap: number | null;
}) {
  if (laps.length === 0) {
    return (
      <section className={SECTION}>
        <h3 className="mb-2 font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
          Lap pace progression
        </h3>
        <p className="font-v2-body text-sm text-v2-on-surface-variant">
          No lap times available.
        </p>
      </section>
    );
  }

  const times = laps.map((l) => l.timeMs);
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = Math.max(max - min, 1);
  const w = 300;
  const h = 80;
  const points = laps
    .map((lap, i) => {
      const x = laps.length === 1 ? w / 2 : (i / (laps.length - 1)) * w;
      const y = h - 8 - ((lap.timeMs - min) / span) * (h - 16);
      return `${x},${y}`;
    })
    .join(" ");

  const selected = laps.find((l) => l.lap === selectedLap);
  const best =
    bestLapLapNumber != null
      ? laps.find((l) => l.lap === bestLapLapNumber)
      : laps.find((l) => l.timeMs === min);

  return (
    <section className={SECTION}>
      <h3 className="mb-3 font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
        Lap pace progression
      </h3>
      <div className="relative h-24">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          aria-hidden
        >
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={points}
          />
        </svg>
      </div>
      <p className="mt-2 font-v2-body text-[11px] text-v2-on-surface-variant">
        {selected
          ? `Viewing Lap ${selected.lap} · ${formatLapMs(selected.timeMs)}`
          : `${laps.length} timed laps`}
        {best ? ` · Best Lap ${best.lap} · ${formatLapMs(best.timeMs)}` : ""}
      </p>
    </section>
  );
}

function FuelPanelV2({ summary }: { summary: TelemetrySummaryResponse }) {
  const fuel = summary.fuel;
  if (!fuel || fuel.perLap.length === 0) {
    return (
      <p className="font-v2-body text-sm text-v2-on-surface-variant">
        No fuel telemetry for this session.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="Tank"
          value={
            fuel.tankCapacityL != null ? `${fuel.tankCapacityL.toFixed(1)} L` : "—"
          }
        />
        <Stat
          label="Avg / lap"
          value={
            fuel.avgFuelPerLapL != null
              ? `${fuel.avgFuelPerLapL.toFixed(2)} L`
              : "—"
          }
        />
        <Stat
          label="Proj. laps"
          value={(() => {
            const projected = fuel.projectedLaps ?? fuel.projectedLapsFromFull;
            return projected != null ? String(projected) : "—";
          })()}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[240px] text-left">
          <thead>
            <tr className="border-b border-v2-outline-variant/15 font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
              <th className="py-2">Lap</th>
              <th className="py-2">Level</th>
              <th className="py-2">Used</th>
            </tr>
          </thead>
          <tbody className="font-v2-body text-xs text-v2-on-surface">
            {fuel.perLap.map((row) => (
              <tr
                key={row.lapNumber}
                className="border-b border-v2-outline-variant/5"
              >
                <td className="py-2">{row.lapNumber}</td>
                <td className="py-2">
                  {row.fuelLevelL != null
                    ? `${row.fuelLevelL.toFixed(2)} L`
                    : "—"}
                </td>
                <td className="py-2">
                  {row.fuelUsedL != null
                    ? `${row.fuelUsedL.toFixed(2)} L`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TyresPanelV2({
  summary,
  selectedLap,
}: {
  summary: TelemetrySummaryResponse;
  selectedLap: number | null;
}) {
  const perLap = summary.tyres?.perLap ?? [];
  if (perLap.length === 0) {
    return (
      <p className="font-v2-body text-sm text-v2-on-surface-variant">
        No tyre telemetry for this session.
      </p>
    );
  }
  const row =
    perLap.find((t) => t.lapNumber === selectedLap) ??
    perLap[perLap.length - 1]!;
  const corners: { label: string; temp?: number; wear?: number }[] = [
    { label: "Front left", temp: row.corners.lf, wear: row.wear?.lf },
    { label: "Front right", temp: row.corners.rf, wear: row.wear?.rf },
    { label: "Rear left", temp: row.corners.lr, wear: row.wear?.lr },
    { label: "Rear right", temp: row.corners.rr, wear: row.wear?.rr },
  ];

  return (
    <div className="space-y-3">
      <p className="font-v2-body text-[11px] text-v2-on-surface-variant">
        Lap {row.lapNumber}
        {row.frontAvg != null || row.rearAvg != null
          ? ` · Front avg ${row.frontAvg?.toFixed(0) ?? "—"}°C · Rear avg ${row.rearAvg?.toFixed(0) ?? "—"}°C`
          : ""}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {corners.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container p-3"
          >
            <p className="font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
              {c.label}
            </p>
            <p className="mt-1 font-v2-headline text-lg font-bold text-v2-on-surface">
              {c.temp != null ? `${Math.round(c.temp)}°C` : "—"}
            </p>
            <p className="font-v2-body text-[11px] text-v2-on-surface-variant">
              {c.wear != null ? `${Math.round(c.wear)}% wear` : "Wear —"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-v2-surface-container p-2.5">
      <p className="font-v2-body text-[9px] font-bold uppercase text-v2-on-surface-variant">
        {label}
      </p>
      <p className="font-v2-headline text-sm font-bold text-v2-on-surface">
        {value}
      </p>
    </div>
  );
}

/** Helpers used by the analysis overview card. */
export function telemetryOverviewFromTraces(
  traces: TelemetryTracesResponse | undefined | null,
): {
  topSpeedKmh: number | null;
  avgBrakePct: number | null;
  highestGear: number | null;
  topGearDistancePct: number | null;
} {
  if (!traces || traces.speedKmh.length === 0) {
    return {
      topSpeedKmh: null,
      avgBrakePct: null,
      highestGear: null,
      topGearDistancePct: null,
    };
  }
  let top = -Infinity;
  for (const v of traces.speedKmh) {
    if (Number.isFinite(v) && v > top) top = v;
  }
  let brakeSum = 0;
  let brakeN = 0;
  for (const v of traces.brakePct) {
    if (Number.isFinite(v)) {
      brakeSum += v;
      brakeN += 1;
    }
  }

  let highestGear: number | null = null;
  const gears = traces.gear ?? [];
  for (const g of gears) {
    if (typeof g === "number" && Number.isFinite(g) && g > 0) {
      if (highestGear == null || g > highestGear) highestGear = g;
    }
  }

  let topGearDistancePct: number | null = null;
  const dist = traces.distanceM ?? [];
  if (highestGear != null && dist.length >= 2 && gears.length === dist.length) {
    let total = 0;
    let inTop = 0;
    for (let i = 1; i < dist.length; i++) {
      const d0 = dist[i - 1]!;
      const d1 = dist[i]!;
      if (!Number.isFinite(d0) || !Number.isFinite(d1) || d1 <= d0) continue;
      const delta = d1 - d0;
      total += delta;
      const g = gears[i]!;
      if (g === highestGear) inTop += delta;
    }
    if (total > 0) {
      topGearDistancePct = (inTop / total) * 100;
    }
  }

  return {
    topSpeedKmh: Number.isFinite(top) ? top : null,
    avgBrakePct: brakeN > 0 ? brakeSum / brakeN : null,
    highestGear,
    topGearDistancePct,
  };
}

export function aggregateTyreWearPct(
  summary: TelemetrySummaryResponse | undefined | null,
): number | null {
  const rows = summary?.tyres?.perLap ?? [];
  const wears: number[] = [];
  for (const row of rows) {
    const w = row.wear;
    if (!w) continue;
    for (const v of [w.lf, w.rf, w.lr, w.rr]) {
      if (typeof v === "number" && Number.isFinite(v)) wears.push(v);
    }
  }
  if (wears.length === 0) return null;
  return wears.reduce((a, b) => a + b, 0) / wears.length;
}
