import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TelemetryTracesResponse } from "./types";

function buildChartData(traces: TelemetryTracesResponse) {
  const n = traces.distanceM.length;
  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push({
      distanceKm: traces.distanceM[i]! / 1000,
      speed: traces.speedKmh[i],
      throttle: traces.throttlePct[i],
      brake: traces.brakePct[i],
      gear: traces.gear[i],
      steering: traces.steeringDeg?.[i],
      deltaSec: traces.deltaMs?.[i] != null ? traces.deltaMs[i]! / 1000 : undefined,
    });
  }
  return rows;
}

type DrivingTracesChartProps = {
  traces: TelemetryTracesResponse;
  compareLapNumber?: number | null;
};

export function DrivingTracesChart({ traces, compareLapNumber }: DrivingTracesChartProps) {
  const data = buildChartData(traces);

  return (
    <div className="space-y-6">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: compareLapNumber != null ? 48 : 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <XAxis
              dataKey="distanceKm"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              tickFormatter={(v) => `${Number(v).toFixed(1)} km`}
            />
            <YAxis
              yAxisId="speed"
              orientation="left"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              domain={[0, "auto"]}
            />
            {compareLapNumber != null && (
              <YAxis
                yAxisId="delta"
                orientation="right"
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `${Number(v).toFixed(1)}s`}
              />
            )}
            <Tooltip
              contentStyle={{
                background: "rgba(15,15,20,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
              labelFormatter={(v) => `${Number(v).toFixed(2)} km`}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }} />
            <Line
              yAxisId="speed"
              type="monotone"
              dataKey="speed"
              name="Speed (km/h)"
              stroke="#38bdf8"
              dot={false}
              strokeWidth={2}
            />
            {compareLapNumber != null && (
              <Line
                yAxisId="delta"
                type="monotone"
                dataKey="deltaSec"
                name="Delta (s)"
                stroke="#fbbf24"
                dot={false}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <XAxis
              dataKey="distanceKm"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              tickFormatter={(v) => `${Number(v).toFixed(1)} km`}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15,15,20,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }} />
            <Line
              type="monotone"
              dataKey="throttle"
              name="Throttle %"
              stroke="#34d399"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="brake"
              name="Brake %"
              stroke="#f87171"
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <XAxis
              dataKey="distanceKm"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              tickFormatter={(v) => `${Number(v).toFixed(1)} km`}
            />
            <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,15,20,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }} />
            <Line
              type="stepAfter"
              dataKey="gear"
              name="Gear"
              stroke="#c084fc"
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
