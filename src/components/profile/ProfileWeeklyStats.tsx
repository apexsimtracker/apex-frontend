import type { Dispatch, SetStateAction } from "react";
import { formatAvgFinishOneDecimal } from "@/lib/utils";

type WeeklyBuckets = { Mon: number; Tue: number; Wed: number; Thu: number; Fri: number; Sat: number; Sun: number };

type ProfileWeeklyStatsProps = {
  weeklyTotal: number;
  weeklyValues: number[];
  maxWeekly: number;
  hoveredDay: string | null;
  setHoveredDay: Dispatch<SetStateAction<string | null>>;
  buckets: WeeklyBuckets;
  totalRaces: number;
  wins: number | null | undefined;
  avgFinish: number | null | undefined;
  totalKm: number | null | undefined;
};

export function ProfileWeeklyStats({
  weeklyTotal,
  weeklyValues,
  maxWeekly,
  hoveredDay,
  setHoveredDay,
  totalRaces,
  wins,
  avgFinish,
  totalKm,
}: ProfileWeeklyStatsProps) {
  const safeValue = (v: number | null | undefined) => (v === null || v === undefined ? "—" : v);

  return (
    <div className="border-white/6 rounded-lg border bg-card/20 p-6 backdrop-blur-lg md:col-span-2">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-foreground">Weekly Stats</h2>

      <div className="mb-8">
        {weeklyTotal === 0 ? (
          <div className="flex h-[220px] flex-col items-center justify-center text-center text-neutral-400">
            <div className="text-sm">No sessions this week yet.</div>
            <div className="mt-1 text-xs text-neutral-500">Run a session to start building your weekly pattern.</div>
          </div>
        ) : (
          <div className="mb-4 flex h-[160px] items-end justify-between gap-2">
            {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map((day, i) => {
              const value = weeklyValues[i] ?? 0;
              const heightPct = (value / maxWeekly) * 100;
              return (
                <div key={day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex h-[160px] w-full items-end justify-center">
                    <div
                      className="group relative w-full cursor-pointer rounded-lg transition-all duration-300"
                      style={{
                        height: `${heightPct}%`,
                        background:
                          "linear-gradient(to top, rgb(240, 28, 28), rgba(240, 28, 28, 0.6))",
                      }}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {hoveredDay === day && (
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center rounded-lg p-2"
                          style={{ backgroundColor: "rgba(240, 28, 28, 0.2)" }}
                        >
                          <p className="text-xs font-bold text-white">{day}</p>
                          <p className="text-xs text-white">{value} races</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground" title="Race sessions only — practice and qualifying excluded">
            Total Races
          </p>
          <p className="text-2xl font-bold text-foreground">{totalRaces}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Wins</p>
          <p className="text-2xl font-bold text-yellow-200">{safeValue(wins)}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Avg Finish</p>
          <p className="text-2xl font-bold text-foreground">{formatAvgFinishOneDecimal(avgFinish)}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Total KM</p>
          <p className="text-2xl font-bold text-black dark:text-white">{safeValue(totalKm)}</p>
        </div>
      </div>
    </div>
  );
}

