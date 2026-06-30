import SimBadge from "@/components/SimBadge";
import { getSimDisplayName } from "@/lib/sim";

type StatsByGameRow = {
  sim: string;
  races: number;
  wins: number | null;
  podiums: number | null;
  poles: number | null;
  fastestLaps: number;
  winPct: number | null;
  podiumPct: number | null;
};

export function ProfileStatsByGame({ rows }: { rows: StatsByGameRow[] }) {
  const safeValue = (v: number | null | undefined) =>
    v === null || v === undefined ? "—" : v;

  return (
    <div className="border/20 mt-10 border-t pt-10">
      <h3 className="mb-6 text-xl font-bold text-foreground">Stats by Game</h3>
      {(rows?.length ?? 0) === 0 ? (
        <div className="text-sm text-neutral-400">
          Stats by game will appear after you record sessions.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(rows ?? []).map((game) => (
            <div key={game.sim} className="rounded-2xl bg-secondary/20 p-5">
              <div className="mb-3 flex items-center gap-2">
                <h4 className="text-base font-bold text-foreground">
                  {getSimDisplayName(game.sim)}
                </h4>
                <SimBadge sim={game.sim} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Races</span>
                  <span className="font-semibold text-foreground">
                    {game.races}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wins</span>
                  <span className="font-semibold text-yellow-200">
                    {safeValue(game.wins)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Podiums</span>
                  <span className="font-semibold text-foreground">
                    {safeValue(game.podiums)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pole Positions</span>
                  <span className="font-semibold text-foreground">
                    {safeValue(game.poles)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fastest Laps</span>
                  <span className="font-semibold text-purple-500">
                    {game.fastestLaps}
                  </span>
                </div>
                <div className="mt-2 border pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win %</span>
                    <span className="font-semibold text-foreground">
                      {game.winPct != null && Number.isFinite(game.winPct)
                        ? `${game.winPct.toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Podium %</span>
                    <span className="font-semibold text-foreground">
                      {game.podiumPct != null && Number.isFinite(game.podiumPct)
                        ? `${game.podiumPct.toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
