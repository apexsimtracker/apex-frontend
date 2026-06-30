import SimBadge from "@/components/SimBadge";
import { SimLogo } from "@/components/SimLogo";
import { getSimDisplayName } from "@/lib/sim";

type MostPlayedRow = {
  sim: string;
  sessions: number;
  km: number | null;
  pctOfTotal: number;
};

export function ProfileMostPlayed({ rows }: { rows: MostPlayedRow[] }) {
  return (
    <div className="border-white/6 rounded-lg border bg-card/20 p-6 backdrop-blur-lg">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-foreground">
        Most Played
      </h2>
      {(rows?.length ?? 0) === 0 ? (
        <div className="flex h-[220px] flex-col items-center justify-center text-center text-neutral-400">
          <div className="text-sm">No sessions recorded yet.</div>
          <div className="mt-1 text-xs text-neutral-500">
            Your most-played sims will appear here.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(rows ?? []).map((sim) => (
            <div key={sim.sim}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="font-semibold text-foreground">
                      {getSimDisplayName(sim.sim)}
                    </p>
                    <SimBadge sim={sim.sim} />
                  </div>
                </div>
                <div className="flex size-10 flex-1 items-center justify-end">
                  <SimLogo sim={sim.sim} />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {sim.km != null ? `${sim.km} km` : "—"}
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-secondary/40">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, sim.pctOfTotal)}%`,
                    backgroundColor: "rgb(240, 28, 28)",
                  }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {sim.pctOfTotal.toFixed(0)}% of total • {sim.sessions} sessions
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
