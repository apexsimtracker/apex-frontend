import { useMemo } from "react";
import uPlot, { type AlignedData, type Options } from "uplot";
import type { TelemetryTracesResponse } from "@/features/telemetry-analysis/types";
import {
  downsampleAlignedTelemetry,
  DEFAULT_TELEMETRY_DOWNSAMPLE_TARGET,
} from "@/lib/telemetryDownsample";
import UPlotReact from "./UPlotReact";

const SYNC_KEY = "v2-session-telemetry";

const AXIS_COLOR = "rgba(148, 163, 184, 0.45)";
const GRID_COLOR = "rgba(148, 163, 184, 0.12)";
const LABEL_COLOR = "rgba(203, 213, 225, 0.85)";

type SessionTelemetryChartsV2Props = {
  traces: TelemetryTracesResponse;
};

function baseOptions(
  height: number,
  yLabel: string,
  series: Options["series"],
): Options {
  return {
    height,
    width: 600,
    scales: {
      x: { time: false },
    },
    axes: [
      {
        stroke: AXIS_COLOR,
        grid: { stroke: GRID_COLOR },
        ticks: { stroke: AXIS_COLOR },
        font: "11px Inter, system-ui, sans-serif",
        values: (_u, vals) => vals.map((v) => `${Number(v).toFixed(2)}`),
      },
      {
        stroke: AXIS_COLOR,
        grid: { stroke: GRID_COLOR },
        ticks: { stroke: AXIS_COLOR },
        font: "11px Inter, system-ui, sans-serif",
        label: yLabel,
        labelFont: "11px Inter, system-ui, sans-serif",
        labelSize: 12,
        labelGap: 6,
        size: 48,
      },
    ],
    series,
    legend: { show: true },
    cursor: {
      drag: { x: true, y: false },
      focus: { prox: 24 },
      points: { size: 6 },
    },
  };
}

export default function SessionTelemetryChartsV2({
  traces,
}: SessionTelemetryChartsV2Props) {
  const downsampled = useMemo(() => {
    return downsampleAlignedTelemetry(
      {
        distanceM: traces.distanceM,
        speedKmh: traces.speedKmh,
        throttlePct: traces.throttlePct,
        brakePct: traces.brakePct,
        gear: traces.gear,
        steeringDeg: traces.steeringDeg,
        rpm: traces.rpm,
        clutchPct: traces.clutchPct,
        deltaMs: traces.deltaMs,
      },
      DEFAULT_TELEMETRY_DOWNSAMPLE_TARGET,
    );
  }, [traces]);

  const distanceKm = useMemo(
    () => downsampled.distanceM.map((m) => m / 1000),
    [downsampled.distanceM],
  );

  const speedData = useMemo<AlignedData>(() => {
    const cols: AlignedData = [distanceKm, downsampled.speedKmh ?? []];
    if (downsampled.deltaMs) {
      cols.push(downsampled.deltaMs.map((ms) => ms / 1000));
    }
    return cols;
  }, [distanceKm, downsampled.speedKmh, downsampled.deltaMs]);

  const inputsData = useMemo<AlignedData>(
    () => [
      distanceKm,
      downsampled.throttlePct ?? [],
      downsampled.brakePct ?? [],
    ],
    [distanceKm, downsampled.throttlePct, downsampled.brakePct],
  );

  const gearData = useMemo<AlignedData>(
    () => [distanceKm, downsampled.gear ?? []],
    [distanceKm, downsampled.gear],
  );

  const steeringData = useMemo<AlignedData | null>(() => {
    if (!downsampled.steeringDeg) return null;
    return [distanceKm, downsampled.steeringDeg];
  }, [distanceKm, downsampled.steeringDeg]);

  const rpmClutchData = useMemo<AlignedData | null>(() => {
    if (!downsampled.rpm && !downsampled.clutchPct) return null;
    const cols: AlignedData = [distanceKm];
    if (downsampled.rpm) cols.push(downsampled.rpm);
    if (downsampled.clutchPct) cols.push(downsampled.clutchPct);
    return cols;
  }, [distanceKm, downsampled.rpm, downsampled.clutchPct]);

  const speedOpts = useMemo(() => {
    const series: Options["series"] = [
      { label: "Distance (km)" },
      {
        label: "Speed",
        stroke: "#3b82f6",
        width: 1.5,
        points: { show: false },
      },
    ];
    if (downsampled.deltaMs) {
      series.push({
        label: "Δ (s)",
        stroke: "#f59e0b",
        width: 1.25,
        points: { show: false },
        scale: "delta",
      });
    }
    const opts = baseOptions(140, "km/h", series);
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
  }, [downsampled.deltaMs]);

  const inputsOpts = useMemo(
    () =>
      baseOptions(120, "%", [
        { label: "Distance (km)" },
        {
          label: "Throttle",
          stroke: "#22c55e",
          width: 1.5,
          points: { show: false },
        },
        {
          label: "Brake",
          stroke: "#ef4444",
          width: 1.5,
          points: { show: false },
        },
      ]),
    [],
  );

  const gearOpts = useMemo(
    () =>
      baseOptions(100, "Gear", [
        { label: "Distance (km)" },
        {
          label: "Gear",
          stroke: "#a78bfa",
          width: 1.5,
          points: { show: false },
          paths: uPlot.paths.stepped!({ align: 1 }),
        },
      ]),
    [],
  );

  const steeringOpts = useMemo(
    () =>
      baseOptions(110, "deg", [
        { label: "Distance (km)" },
        {
          label: "Steering",
          stroke: "#a855f7",
          width: 1.5,
          points: { show: false },
        },
      ]),
    [],
  );

  const rpmOpts = useMemo(() => {
    const series: Options["series"] = [{ label: "Distance (km)" }];
    if (downsampled.rpm) {
      series.push({
        label: "RPM",
        stroke: "#38bdf8",
        width: 1.5,
        points: { show: false },
      });
    }
    if (downsampled.clutchPct) {
      series.push({
        label: "Clutch %",
        stroke: "#f472b6",
        width: 1.25,
        points: { show: false },
        scale: "clutch",
      });
    }
    const opts = baseOptions(120, downsampled.rpm ? "RPM" : "%", series);
    if (downsampled.clutchPct) {
      opts.scales = { ...(opts.scales ?? {}), clutch: { auto: true } };
    }
    return opts;
  }, [downsampled.rpm, downsampled.clutchPct]);

  return (
    <div className="space-y-3">
      <p className="font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
        Distance (km) · synced cursor
      </p>
      <ChartCard title="Speed">
        <div data-testid="telemetry-driving-charts-v2">
          <UPlotReact
            options={speedOpts}
            data={speedData}
            syncKey={SYNC_KEY}
            className="w-full"
          />
        </div>
      </ChartCard>
      <ChartCard title="Throttle / Brake">
        <UPlotReact
          options={inputsOpts}
          data={inputsData}
          syncKey={SYNC_KEY}
          className="w-full"
        />
      </ChartCard>
      <ChartCard title="Gear">
        <UPlotReact
          options={gearOpts}
          data={gearData}
          syncKey={SYNC_KEY}
          className="w-full"
        />
      </ChartCard>
      {steeringData && (
        <ChartCard title="Steering">
          <UPlotReact
            options={steeringOpts}
            data={steeringData}
            syncKey={SYNC_KEY}
            className="w-full"
          />
        </ChartCard>
      )}
      {rpmClutchData && (
        <ChartCard title="RPM / Clutch">
          <UPlotReact
            options={rpmOpts}
            data={rpmClutchData}
            syncKey={SYNC_KEY}
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
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-v2-surface-container/60 p-2">
      <p className="mb-1 px-1 font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
        {title}
      </p>
      {children}
    </div>
  );
}
