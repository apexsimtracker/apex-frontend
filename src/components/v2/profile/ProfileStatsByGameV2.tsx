import { getSimDisplayName } from "@/lib/sim";
import { cn } from "@/lib/utils";
import {
  getDisciplineWinColorClass,
  sortDisciplineRows,
} from "@/components/v2/profile/profileDisciplineAssets";

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

function StatRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="font-v2-body text-xs text-v2-on-surface-variant">
        {label}
      </span>
      <span
        className={cn(
          "font-v2-body text-sm font-semibold",
          valueClassName ?? "text-v2-on-surface",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function ProfileStatsByGameV2({ rows }: { rows: StatsByGameRow[] }) {
  const safeValue = (v: number | null | undefined) =>
    v === null || v === undefined ? "—" : v;

  const sortedRows = sortDisciplineRows(rows ?? []);

  return (
    <section className="space-y-4">
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        Stats by game
      </h2>

      {sortedRows.length === 0 ? (
        <p className="font-v2-body text-sm text-v2-on-surface-variant">
          Stats by game will appear after you record sessions.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedRows.map((game) => (
            <div
              key={game.sim}
              className="rounded-lg bg-v2-surface-container-low p-5"
            >
              <h3 className="mb-4 font-v2-headline text-sm font-semibold text-v2-on-surface">
                {getSimDisplayName(game.sim)}
              </h3>
              <div className="space-y-2">
                <StatRow label="Races" value={game.races} />
                <StatRow
                  label="Wins"
                  value={safeValue(game.wins)}
                  valueClassName={getDisciplineWinColorClass(game.sim)}
                />
                <StatRow label="Podiums" value={safeValue(game.podiums)} />
                <StatRow label="Pole Positions" value={safeValue(game.poles)} />
                <StatRow
                  label="Fastest Laps"
                  value={game.fastestLaps}
                  valueClassName="text-purple-500"
                />
                <div className="mt-2 border-t border-v2-outline-variant/15 pt-2">
                  <StatRow
                    label="Win %"
                    value={
                      game.winPct != null && Number.isFinite(game.winPct)
                        ? `${game.winPct.toFixed(1)}%`
                        : "—"
                    }
                  />
                  <StatRow
                    label="Podium %"
                    value={
                      game.podiumPct != null && Number.isFinite(game.podiumPct)
                        ? `${game.podiumPct.toFixed(1)}%`
                        : "—"
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
