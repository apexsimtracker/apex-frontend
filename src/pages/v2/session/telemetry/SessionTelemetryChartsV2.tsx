import { useMemo } from "react";
import uPlot, { type AlignedData, type Options } from "uplot";
import type { TelemetryTracesResponse } from "@/features/telemetry-analysis/types";
import {
  clampToMonotonicDistance,
  downsampleAlignedTelemetry,
  resampleChannelToGrid,
  DEFAULT_TELEMETRY_DOWNSAMPLE_TARGET,
} from "@/lib/telemetryDownsample";
import UPlotReact from "./UPlotReact";

const SYNC_KEY = "v2-session-telemetry";

/**
 * Shared height for every Driving chart so all stacked cards render at the exact
 * same outer height. Kept in one place so the inline overview stays a clean,
 * balanced stack; the modal deep-dive passes a taller value instead.
 */
const CARD_CHART_HEIGHT = 128;

const AXIS_COLOR = "rgba(148, 163, 184, 0.45)";
const GRID_COLOR = "rgba(148, 163, 184, 0.12)";
const LABEL_COLOR = "rgba(203, 213, 225, 0.85)";

// Primary-lap channel colors.
const C_SPEED = "#3b82f6";
const C_THROTTLE = "#22c55e";
const C_BRAKE = "#ef4444";
const C_GEAR = "#a78bfa";
const C_STEERING = "#a855f7";
const C_RPM = "#38bdf8";
const C_CLUTCH = "#f472b6";
const C_DELTA = "#f59e0b";

// Contrasting compare-lap channel colors (rendered dashed).
const CMP_SPEED = "#f472b6";
const CMP_THROTTLE = "#14b8a6";
const CMP_BRAKE = "#f97316";
const CMP_GEAR = "#fbbf24";
const CMP_STEERING = "#fbbf24";
const CMP_RPM = "#fbbf24";
const CMP_CLUTCH = "#fb7185";

const COMPARE_DASH = [6, 4];

// Subtle alternating tints for Sector 1 / 2 / 3 background bands.
const SECTOR_BAND_COLORS = [
  "rgba(59, 130, 246, 0.07)",
  "rgba(148, 163, 184, 0.05)",
  "rgba(168, 85, 247, 0.07)",
];

export type DrivingChartId = "speed" | "inputs" | "gear" | "steering" | "rpm";

type SessionTelemetryChartsV2Props = {
  traces: TelemetryTracesResponse;
  /** Full traces for a comparison lap, overlaid as dashed contrasting series. */
  compareTraces?: TelemetryTracesResponse | null;
  /** uPlot sync key. Charts sharing a key share cursor + zoom. */
  syncKey?: string;
  /** Uniform per-chart height (px). */
  chartHeight?: number;
  /** When provided, only the listed charts render. */
  visibleCharts?: Set<DrivingChartId> | null;
  /** Interior sector boundary distances in KM; drawn as background bands. */
  sectorBandsKm?: number[] | null;
  /** Tighter axes + explicit bounds + denser ticks for the deep-dive modal. */
  dense?: boolean;
};

type BaseExtra = {
  dense?: boolean;
  yRange?: [number, number];
  plugins?: uPlot.Plugin[];
  extraScales?: Options["scales"];
  extraAxes?: NonNullable<Options["axes"]>;
  gearTicks?: boolean;
};

function sectorBandsPlugin(boundariesKm: number[]): uPlot.Plugin {
  return {
    hooks: {
      // drawClear fires right after the canvas is cleared and before axes /
      // series, so bands render behind the traces and track zoom/pan.
      drawClear: (u: uPlot) => {
        const { ctx } = u;
        const min = u.scales.x?.min;
        const max = u.scales.x?.max;
        if (min == null || max == null) return;
        const edges = [min, ...boundariesKm, max];
        const { top, height, left, width } = u.bbox;
        ctx.save();
        for (let i = 0; i < edges.length - 1; i++) {
          const a = u.valToPos(edges[i]!, "x", true);
          const b = u.valToPos(edges[i + 1]!, "x", true);
          const x0 = Math.max(Math.min(a, b), left);
          const x1 = Math.min(Math.max(a, b), left + width);
          if (x1 <= x0) continue;
          ctx.fillStyle = SECTOR_BAND_COLORS[i % SECTOR_BAND_COLORS.length]!;
          ctx.fillRect(x0, top, x1 - x0, height);
        }
        ctx.restore();
      },
    },
  };
}

function baseOptions(
  height: number,
  yLabel: string,
  series: Options["series"],
  extra: BaseExtra = {},
): Options {
  const { dense, yRange, plugins, extraScales, extraAxes, gearTicks } = extra;

  const scales: Options["scales"] = {
    x: { time: false },
    ...(extraScales ?? {}),
  };
  if (yRange) {
    scales.y = { range: [yRange[0], yRange[1]] };
  }

  const yAxis: NonNullable<Options["axes"]>[number] = {
    stroke: AXIS_COLOR,
    grid: { stroke: GRID_COLOR },
    ticks: { stroke: AXIS_COLOR },
    font: "11px Inter, system-ui, sans-serif",
    label: yLabel,
    labelFont: "11px Inter, system-ui, sans-serif",
    labelSize: 12,
    labelGap: 6,
    size: 48,
  };
  if (gearTicks) {
    yAxis.incrs = [1, 2];
    yAxis.values = (_u, vals) => vals.map((v) => `${Math.round(Number(v))}`);
  }

  return {
    height,
    width: 600,
    scales,
    axes: [
      {
        stroke: AXIS_COLOR,
        grid: { stroke: GRID_COLOR },
        ticks: { stroke: AXIS_COLOR },
        font: "11px Inter, system-ui, sans-serif",
        // Denser increments in the deep-dive view for granular distance reads.
        ...(dense ? { space: 34 } : {}),
        values: (_u, vals) => vals.map((v) => `${Number(v).toFixed(2)}`),
      },
      yAxis,
      ...(extraAxes ?? []),
    ],
    series,
    legend: { show: true },
    cursor: {
      drag: { x: true, y: false },
      focus: { prox: 24 },
      points: { size: 6 },
    },
    ...(plugins && plugins.length ? { plugins } : {}),
  };
}

export default function SessionTelemetryChartsV2({
  traces,
  compareTraces,
  syncKey = SYNC_KEY,
  chartHeight = CARD_CHART_HEIGHT,
  visibleCharts,
  sectorBandsKm,
  dense = false,
}: SessionTelemetryChartsV2Props) {
  const downsampled = useMemo(() => {
    // Drop any trailing distance wrap (e.g. LMU samples past start/finish that
    // reset Lap Dist to ~0) so uPlot's numeric x-axis stays monotonic.
    const monotonic = clampToMonotonicDistance({
      distanceM: traces.distanceM,
      speedKmh: traces.speedKmh,
      throttlePct: traces.throttlePct,
      brakePct: traces.brakePct,
      gear: traces.gear,
      steeringDeg: traces.steeringDeg,
      rpm: traces.rpm,
      clutchPct: traces.clutchPct,
      deltaMs: traces.deltaMs,
    });
    return downsampleAlignedTelemetry(
      monotonic,
      DEFAULT_TELEMETRY_DOWNSAMPLE_TARGET,
    );
  }, [traces]);

  const distanceKm = useMemo(
    () => downsampled.distanceM.map((m) => m / 1000),
    [downsampled.distanceM],
  );

  // Resample the compare lap's channels onto the primary lap's distance grid so
  // overlays stay index-aligned with the primary series and the synced cursor.
  const compareAligned = useMemo(() => {
    if (!compareTraces) return null;
    const mono = clampToMonotonicDistance({
      distanceM: compareTraces.distanceM,
      speedKmh: compareTraces.speedKmh,
      throttlePct: compareTraces.throttlePct,
      brakePct: compareTraces.brakePct,
      gear: compareTraces.gear,
      steeringDeg: compareTraces.steeringDeg,
      rpm: compareTraces.rpm,
      clutchPct: compareTraces.clutchPct,
    });
    const target = downsampled.distanceM;
    const rs = (vals?: number[]) =>
      vals ? resampleChannelToGrid(mono.distanceM, vals, target) : undefined;
    return {
      speedKmh: rs(mono.speedKmh),
      throttlePct: rs(mono.throttlePct),
      brakePct: rs(mono.brakePct),
      gear: rs(mono.gear),
      steeringDeg: rs(mono.steeringDeg),
      rpm: rs(mono.rpm),
      clutchPct: rs(mono.clutchPct),
    };
  }, [compareTraces, downsampled.distanceM]);

  const compareLabel =
    compareTraces?.lapNumber != null ? `L${compareTraces.lapNumber}` : "cmp";

  const maxSpeed = useMemo(() => {
    let m = 0;
    for (const v of downsampled.speedKmh ?? []) if (Number.isFinite(v) && v > m) m = v;
    for (const v of compareAligned?.speedKmh ?? [])
      if (Number.isFinite(v) && v > m) m = v;
    return m > 0 ? m : 1;
  }, [downsampled.speedKmh, compareAligned]);

  const maxGear = useMemo(() => {
    let m = 0;
    for (const v of downsampled.gear ?? []) if (Number.isFinite(v) && v > m) m = v;
    for (const v of compareAligned?.gear ?? [])
      if (Number.isFinite(v) && v > m) m = v;
    return m > 0 ? m : 1;
  }, [downsampled.gear, compareAligned]);

  // Bump this whenever anything the plugins/series schema depend on changes so
  // UPlotReact rebuilds (plugins are only read at construction).
  const resetKey = useMemo(
    () =>
      [
        traces.lapNumber,
        compareTraces?.lapNumber ?? "none",
        dense ? "d" : "s",
        chartHeight,
        sectorBandsKm && sectorBandsKm.length
          ? sectorBandsKm.map((k) => k.toFixed(3)).join(",")
          : "nb",
      ].join("|"),
    [traces.lapNumber, compareTraces, dense, chartHeight, sectorBandsKm],
  );

  const bandPlugins = useMemo<uPlot.Plugin[] | undefined>(
    () =>
      sectorBandsKm && sectorBandsKm.length
        ? [sectorBandsPlugin(sectorBandsKm)]
        : undefined,
    [sectorBandsKm],
  );

  // ---- Speed ----
  const speedData = useMemo<AlignedData>(() => {
    const cols: AlignedData = [distanceKm, downsampled.speedKmh ?? []];
    if (compareAligned?.speedKmh) cols.push(compareAligned.speedKmh);
    if (downsampled.deltaMs) cols.push(downsampled.deltaMs.map((ms) => ms / 1000));
    return cols;
  }, [distanceKm, downsampled.speedKmh, downsampled.deltaMs, compareAligned]);

  const speedOpts = useMemo(() => {
    const series: Options["series"] = [
      { label: "Distance (km)" },
      { label: "Speed", stroke: C_SPEED, width: 1.5, points: { show: false } },
    ];
    if (compareAligned?.speedKmh) {
      series.push({
        label: `Speed ${compareLabel}`,
        stroke: CMP_SPEED,
        width: 1.25,
        dash: COMPARE_DASH,
        points: { show: false },
      });
    }
    if (downsampled.deltaMs) {
      series.push({
        label: "Δ (s)",
        stroke: C_DELTA,
        width: 1.25,
        points: { show: false },
        scale: "delta",
      });
    }
    const opts = baseOptions(chartHeight, "km/h", series, {
      dense,
      yRange: [0, Math.ceil(maxSpeed * 1.05)],
      plugins: bandPlugins,
    });
    if (downsampled.deltaMs) {
      opts.scales = { ...(opts.scales ?? {}), delta: { auto: true } };
      opts.axes = [
        ...(opts.axes ?? []),
        {
          scale: "delta",
          side: 1,
          stroke: AXIS_COLOR,
          grid: { show: false },
          ticks: { stroke: AXIS_COLOR },
          font: "11px Inter, system-ui, sans-serif",
          size: 40,
        },
      ];
    }
    return opts;
  }, [downsampled.deltaMs, compareAligned, compareLabel, chartHeight, dense, maxSpeed, bandPlugins]);

  // ---- Throttle / Brake ----
  const inputsData = useMemo<AlignedData>(() => {
    const cols: AlignedData = [
      distanceKm,
      downsampled.throttlePct ?? [],
      downsampled.brakePct ?? [],
    ];
    if (compareAligned?.throttlePct) cols.push(compareAligned.throttlePct);
    if (compareAligned?.brakePct) cols.push(compareAligned.brakePct);
    return cols;
  }, [distanceKm, downsampled.throttlePct, downsampled.brakePct, compareAligned]);

  const inputsOpts = useMemo(() => {
    const series: Options["series"] = [
      { label: "Distance (km)" },
      { label: "Throttle", stroke: C_THROTTLE, width: 1.5, points: { show: false } },
      { label: "Brake", stroke: C_BRAKE, width: 1.5, points: { show: false } },
    ];
    if (compareAligned?.throttlePct) {
      series.push({
        label: `Throttle ${compareLabel}`,
        stroke: CMP_THROTTLE,
        width: 1.25,
        dash: COMPARE_DASH,
        points: { show: false },
      });
    }
    if (compareAligned?.brakePct) {
      series.push({
        label: `Brake ${compareLabel}`,
        stroke: CMP_BRAKE,
        width: 1.25,
        dash: COMPARE_DASH,
        points: { show: false },
      });
    }
    return baseOptions(chartHeight, "%", series, {
      dense,
      yRange: [0, 100],
      plugins: bandPlugins,
    });
  }, [compareAligned, compareLabel, chartHeight, dense, bandPlugins]);

  // ---- Gear ----
  const gearData = useMemo<AlignedData>(() => {
    const cols: AlignedData = [distanceKm, downsampled.gear ?? []];
    if (compareAligned?.gear) cols.push(compareAligned.gear);
    return cols;
  }, [distanceKm, downsampled.gear, compareAligned]);

  const gearOpts = useMemo(() => {
    const series: Options["series"] = [
      { label: "Distance (km)" },
      {
        label: "Gear",
        stroke: C_GEAR,
        width: 1.5,
        points: { show: false },
        paths: uPlot.paths.stepped!({ align: 1 }),
      },
    ];
    if (compareAligned?.gear) {
      series.push({
        label: `Gear ${compareLabel}`,
        stroke: CMP_GEAR,
        width: 1.25,
        dash: COMPARE_DASH,
        points: { show: false },
        paths: uPlot.paths.stepped!({ align: 1 }),
      });
    }
    return baseOptions(chartHeight, "Gear", series, {
      dense,
      yRange: [0, maxGear + 1],
      gearTicks: true,
      plugins: bandPlugins,
    });
  }, [compareAligned, compareLabel, chartHeight, dense, maxGear, bandPlugins]);

  // ---- Steering ----
  const steeringData = useMemo<AlignedData | null>(() => {
    if (!downsampled.steeringDeg) return null;
    const cols: AlignedData = [distanceKm, downsampled.steeringDeg];
    if (compareAligned?.steeringDeg) cols.push(compareAligned.steeringDeg);
    return cols;
  }, [distanceKm, downsampled.steeringDeg, compareAligned]);

  const steeringOpts = useMemo(() => {
    const series: Options["series"] = [
      { label: "Distance (km)" },
      { label: "Steering", stroke: C_STEERING, width: 1.5, points: { show: false } },
    ];
    if (compareAligned?.steeringDeg) {
      series.push({
        label: `Steering ${compareLabel}`,
        stroke: CMP_STEERING,
        width: 1.25,
        dash: COMPARE_DASH,
        points: { show: false },
      });
    }
    return baseOptions(chartHeight, "deg", series, { dense, plugins: bandPlugins });
  }, [compareAligned, compareLabel, chartHeight, dense, bandPlugins]);

  // ---- RPM / Clutch ----
  const rpmClutchData = useMemo<AlignedData | null>(() => {
    if (!downsampled.rpm && !downsampled.clutchPct) return null;
    const cols: AlignedData = [distanceKm];
    if (downsampled.rpm) cols.push(downsampled.rpm);
    if (downsampled.clutchPct) cols.push(downsampled.clutchPct);
    if (downsampled.rpm && compareAligned?.rpm) cols.push(compareAligned.rpm);
    if (downsampled.clutchPct && compareAligned?.clutchPct)
      cols.push(compareAligned.clutchPct);
    return cols;
  }, [distanceKm, downsampled.rpm, downsampled.clutchPct, compareAligned]);

  const rpmOpts = useMemo(() => {
    const series: Options["series"] = [{ label: "Distance (km)" }];
    if (downsampled.rpm) {
      series.push({ label: "RPM", stroke: C_RPM, width: 1.5, points: { show: false } });
    }
    if (downsampled.clutchPct) {
      series.push({
        label: "Clutch %",
        stroke: C_CLUTCH,
        width: 1.25,
        points: { show: false },
        scale: "clutch",
      });
    }
    if (downsampled.rpm && compareAligned?.rpm) {
      series.push({
        label: `RPM ${compareLabel}`,
        stroke: CMP_RPM,
        width: 1.25,
        dash: COMPARE_DASH,
        points: { show: false },
      });
    }
    if (downsampled.clutchPct && compareAligned?.clutchPct) {
      series.push({
        label: `Clutch ${compareLabel}`,
        stroke: CMP_CLUTCH,
        width: 1.25,
        dash: COMPARE_DASH,
        points: { show: false },
        scale: "clutch",
      });
    }
    const opts = baseOptions(chartHeight, downsampled.rpm ? "RPM" : "%", series, {
      dense,
      plugins: bandPlugins,
    });
    if (downsampled.clutchPct) {
      opts.scales = { ...(opts.scales ?? {}), clutch: { auto: true } };
    }
    return opts;
  }, [downsampled.rpm, downsampled.clutchPct, compareAligned, compareLabel, chartHeight, dense, bandPlugins]);

  const show = (id: DrivingChartId) => !visibleCharts || visibleCharts.has(id);

  return (
    <div className="space-y-3">
      {!dense && (
        <p className="font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
          Distance (km) · synced cursor
          {compareTraces?.lapNumber != null
            ? ` · comparing Lap ${traces.lapNumber} vs Lap ${compareTraces.lapNumber}`
            : ""}
        </p>
      )}
      {show("speed") && (
        <ChartCard title="Speed" dense={dense}>
          <div data-testid="telemetry-driving-charts-v2">
            <UPlotReact
              options={speedOpts}
              data={speedData}
              syncKey={syncKey}
              resetKey={resetKey}
              className="w-full"
            />
          </div>
        </ChartCard>
      )}
      {show("inputs") && (
        <ChartCard title="Throttle / Brake" dense={dense}>
          <UPlotReact
            options={inputsOpts}
            data={inputsData}
            syncKey={syncKey}
            resetKey={resetKey}
            className="w-full"
          />
        </ChartCard>
      )}
      {show("gear") && (
        <ChartCard title="Gear" dense={dense}>
          <UPlotReact
            options={gearOpts}
            data={gearData}
            syncKey={syncKey}
            resetKey={resetKey}
            className="w-full"
          />
        </ChartCard>
      )}
      {steeringData && show("steering") && (
        <ChartCard title="Steering" dense={dense}>
          <UPlotReact
            options={steeringOpts}
            data={steeringData}
            syncKey={syncKey}
            resetKey={resetKey}
            className="w-full"
          />
        </ChartCard>
      )}
      {rpmClutchData && show("rpm") && (
        <ChartCard title="RPM / Clutch" dense={dense}>
          <UPlotReact
            options={rpmOpts}
            data={rpmClutchData}
            syncKey={syncKey}
            resetKey={resetKey}
            className="w-full"
          />
        </ChartCard>
      )}
      <style>{`
        .u-legend { font-size: 11px; color: ${LABEL_COLOR}; }
        .u-inline th, .u-inline td { padding: 0 6px; }
      `}</style>
    </div>
  );
}

function ChartCard({
  title,
  children,
  dense = false,
}: {
  title: string;
  children: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <div
      className={
        dense
          ? "flex h-full flex-col rounded-v2-lg border border-v2-outline-variant/10 bg-v2-surface-container-high p-3"
          : "flex h-full flex-col rounded-lg bg-v2-surface-container/60 p-2"
      }
    >
      <p className="mb-1 px-1 font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
        {title}
      </p>
      {children}
    </div>
  );
}
