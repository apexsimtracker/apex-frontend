import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TelemetrySummaryResponse } from "./types";

type FuelAnalysisChartProps = {
  fuel: NonNullable<TelemetrySummaryResponse["fuel"]>;
};

export function FuelAnalysisChart({ fuel }: FuelAnalysisChartProps) {
  const data = fuel.perLap.map((row) => ({
    lap: row.lapNumber,
    fuelLevelL: row.fuelLevelL,
    fuelUsedL: row.fuelUsedL,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-wider text-white/50">
            Tank capacity
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-white">
            {fuel.tankCapacityL.toFixed(1)} L
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-wider text-white/50">
            Avg per lap
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-white">
            {fuel.avgFuelPerLapL != null
              ? `${fuel.avgFuelPerLapL.toFixed(2)} L`
              : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs uppercase tracking-wider text-white/50">
            Laps from full
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-white">
            {fuel.projectedLapsFromFull ?? "—"}
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="lap"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              label={{
                value: "Lap",
                position: "insideBottom",
                offset: -2,
                fill: "rgba(255,255,255,0.4)",
              }}
            />
            <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,15,20,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}
            />
            <Line
              type="monotone"
              dataKey="fuelLevelL"
              name="Fuel level (L)"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
            <Bar
              dataKey="fuelUsedL"
              name="Used (L)"
              fill="rgba(251,191,36,0.35)"
              radius={[4, 4, 0, 0]}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
