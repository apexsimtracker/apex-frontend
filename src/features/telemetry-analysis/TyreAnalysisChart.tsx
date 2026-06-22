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

type TyreAnalysisChartProps = {
  tyres: NonNullable<TelemetrySummaryResponse["tyres"]>;
};

export function TyreAnalysisChart({ tyres }: TyreAnalysisChartProps) {
  const data = tyres.perLap.map((row) => ({
    lap: row.lapNumber,
    lf: row.corners.lf ?? row.frontAvg,
    rf: row.corners.rf ?? row.frontAvg,
    lr: row.corners.lr ?? row.rearAvg,
    rr: row.corners.rr ?? row.rearAvg,
    wearLf: row.wear?.lf,
    wearRf: row.wear?.rf,
    wearLr: row.wear?.lr,
    wearRr: row.wear?.rr,
  }));

  const hasWear = data.some(
    (d) => d.wearLf != null || d.wearRf != null || d.wearLr != null || d.wearRr != null
  );

  return (
    <div className="space-y-6">
      <p className="text-xs text-white/50">
        For accurate tyre wear in iRacing, complete a proper in-lap and stop in the pit lane.
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <XAxis dataKey="lap" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} unit="°C" />
            <Tooltip
              contentStyle={{
                background: "rgba(15,15,20,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }} />
            <Line type="monotone" dataKey="lf" name="LF" stroke="#38bdf8" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="rf" name="RF" stroke="#22d3ee" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="lr" name="LR" stroke="#f97316" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="rr" name="RR" stroke="#fb923c" dot={false} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {hasWear && (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis dataKey="lap" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,15,20,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }} />
              <Bar dataKey="wearLf" name="LF wear" fill="#38bdf8" />
              <Bar dataKey="wearRf" name="RF wear" fill="#22d3ee" />
              <Bar dataKey="wearLr" name="LR wear" fill="#f97316" />
              <Bar dataKey="wearRr" name="RR wear" fill="#fb923c" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
