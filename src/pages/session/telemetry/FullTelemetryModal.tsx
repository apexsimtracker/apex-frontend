import { useDeferredValue, useMemo, useState } from "react";
import { AppBaseModal } from "@/components/app-ui/AppBaseModal";
import { cn } from "@/lib/utils";
import { useTelemetryTraces } from "@/features/telemetry-analysis/useSessionTelemetry";
import type {
  TelemetryLapSummary,
  TelemetryTracesResponse,
} from "@/features/telemetry-analysis/types";
import { clampToMonotonicDistance } from "@/lib/telemetryDownsample";
import { computeSectorBoundaryDistances } from "@/lib/telemetrySectors";
import SessionTelemetryCharts, {
  type DrivingChartId,
} from "./SessionTelemetryCharts";
import TelemetryLapPicker from "./TelemetryLapPicker";

const MODAL_SYNC_KEY = "session-telemetry-modal";
const MODAL_CHART_HEIGHT = 200;

/** Per-lap sector durations used to derive sector-band distances. */
export type SectorLapTimes = {
  lap: number;
  timeMs: number;
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
};

type ChartMeta = { id: DrivingChartId; label: string };

const ALL_CHART_META: ChartMeta[] = [
  { id: "speed", label: "Speed" },
  { id: "inputs", label: "Throttle / Brake" },
  { id: "gear", label: "Gear" },
  { id: "steering", label: "Steering" },
  { id: "rpm", label: "RPM / Clutch" },
];

type FullTelemetryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  /** Primary lap traces already loaded by the background page (may carry delta). */
  traces: TelemetryTracesResponse;
  laps: TelemetryLapSummary[];
  selectedLap: number | null;
  compareLap: number | null;
  onSelectLap: (lapNumber: number) => void;
  onSelectCompare: (lapNumber: number | null) => void;
  sectorTimes: SectorLapTimes[];
};

export default function FullTelemetryModal({
  isOpen,
  onClose,
  sessionId,
  traces,
  laps,
  selectedLap,
  compareLap,
  onSelectLap,
  onSelectCompare,
  sectorTimes,
}: FullTelemetryModalProps) {
  // Which stacked traces are currently shown. Deferred so rapid pill toggling
  // stays responsive while the (heavier) uPlot work catches up.
  const [visible, setVisible] = useState<Set<DrivingChartId>>(
    () => new Set(ALL_CHART_META.map((c) => c.id)),
  );
  const deferredVisible = useDeferredValue(visible);

  const availableCharts = useMemo(() => {
    const hasSteering = Boolean(traces.steeringDeg?.length);
    const hasRpm = Boolean(traces.rpm?.length || traces.clutchPct?.length);
    return ALL_CHART_META.filter((c) => {
      if (c.id === "steering") return hasSteering;
      if (c.id === "rpm") return hasRpm;
      return true;
    });
  }, [traces.steeringDeg, traces.rpm, traces.clutchPct]);

  // Fetch the compare lap's own full traces (no delta) for the dashed overlay.
  const { data: compareTraces } = useTelemetryTraces(
    sessionId,
    compareLap,
    null,
    isOpen && compareLap != null,
  );

  // Derive sector-band distances (km) from the selected lap's real data. Uses
  // the same clamped distance domain the charts plot, and returns null when the
  // reconstruction cannot be trusted (bands are simply omitted then).
  const sectorBandsKm = useMemo(() => {
    if (selectedLap == null) return null;
    const lap = sectorTimes.find((l) => l.lap === selectedLap);
    if (!lap) return null;
    const mono = clampToMonotonicDistance({
      distanceM: traces.distanceM,
      speedKmh: traces.speedKmh,
    });
    const boundariesM = computeSectorBoundaryDistances(
      mono.distanceM,
      mono.speedKmh ?? [],
      {
        sector1Ms: lap.sector1Ms,
        sector2Ms: lap.sector2Ms,
        sector3Ms: lap.sector3Ms,
        lapTimeMs: lap.timeMs || traces.lapTimeMs,
      },
    );
    return boundariesM ? boundariesM.map((m) => m / 1000) : null;
  }, [selectedLap, sectorTimes, traces]);

  function toggle(id: DrivingChartId) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Keep at least one chart visible.
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const hasSectorBands = Boolean(sectorBandsKm && sectorBandsKm.length);

  return (
    <AppBaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Full Telemetry"
      description="High-density driving traces on a synced distance axis — compare laps, isolate inputs, and read sector bands."
      size="full"
      mobileVariant="centered"
      contentClassName="w-[95vw] max-w-[1600px] sm:max-w-[1600px] h-[min(90dvh,calc(100dvh-4rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)))] max-h-[min(90dvh,calc(100dvh-4rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)))]"
      headerClassName="sr-only"
      bodyClassName="px-0 pt-0 sm:px-0"
    >
      <div data-testid="full-telemetry-modal">
        <div
          className="space-y-1 px-5 pb-4 pt-5 sm:px-6"
          aria-hidden
        >
          <h2 className="font-apex-headline text-lg font-semibold leading-7 text-apex-on-surface">
            Full Telemetry
          </h2>
          <p className="font-apex-body text-sm leading-6 text-apex-on-surface-variant">
            High-density driving traces on a synced distance axis — compare
            laps, isolate inputs, and read sector bands.
          </p>
        </div>

        <div className="space-y-4 border-b border-apex-outline-variant/15 bg-apex-surface-container px-5 pb-4 sm:px-6">
          <TelemetryLapPicker
            laps={laps}
            selectedLap={selectedLap}
            compareLap={compareLap}
            onSelectLap={onSelectLap}
            onSelectCompare={onSelectCompare}
          />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-apex-body text-[10px] font-bold uppercase tracking-widest text-apex-on-surface-variant">
                Channels
              </span>
              {availableCharts.map((c) => {
                const active = visible.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(c.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 font-apex-body text-xs font-bold transition-colors",
                      active
                        ? "bg-apex-primary text-white"
                        : "border border-apex-outline-variant/30 text-apex-on-surface-variant hover:bg-apex-surface-container-high hover:text-apex-on-surface",
                    )}
                    data-testid={`full-telemetry-toggle-${c.id}`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 font-apex-body text-[11px] text-apex-on-surface-variant">
              {compareTraces?.lapNumber != null && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-4 rounded bg-apex-on-surface-variant" />
                  Solid Lap {traces.lapNumber}
                  <span className="mx-1 opacity-40">·</span>
                  <span
                    className="inline-block h-0 w-4 border-t-2 border-dashed border-apex-on-surface-variant"
                    aria-hidden
                  />
                  Dashed Lap {compareTraces.lapNumber}
                </span>
              )}
              {hasSectorBands && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex overflow-hidden rounded-sm">
                    <span className="h-3 w-2 bg-[rgba(59,130,246,0.35)]" />
                    <span className="h-3 w-2 bg-[rgba(148,163,184,0.28)]" />
                    <span className="h-3 w-2 bg-[rgba(168,85,247,0.35)]" />
                  </span>
                  Sectors
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 pb-8 pt-4 sm:px-6">
          <SessionTelemetryCharts
            traces={traces}
            compareTraces={compareTraces ?? null}
            syncKey={MODAL_SYNC_KEY}
            chartHeight={MODAL_CHART_HEIGHT}
            visibleCharts={deferredVisible}
            sectorBandsKm={sectorBandsKm}
            dense
          />
        </div>
      </div>
    </AppBaseModal>
  );
}
