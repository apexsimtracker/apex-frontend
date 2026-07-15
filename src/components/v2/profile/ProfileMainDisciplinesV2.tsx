import { getSimDisplayName } from "@/lib/sim";
import { cn } from "@/lib/utils";
import {
  getDisciplineBarClass,
  getDisciplineLogoSrc,
  sortDisciplineRows,
} from "@/components/v2/profile/profileDisciplineAssets";

type MostPlayedRow = {
  sim: string;
  sessions: number;
  km: number | null;
  pctOfTotal: number;
};

function DisciplineLogo({ sim }: { sim: string }) {
  const src = getDisciplineLogoSrc(sim);
  const label = getSimDisplayName(sim);
  return (
    <img
      src={src}
      alt={label}
      className="h-6 w-auto object-contain"
      loading="lazy"
      decoding="async"
    />
  );
}

export function ProfileMainDisciplinesV2({ rows }: { rows: MostPlayedRow[] }) {
  const sortedRows = sortDisciplineRows(rows ?? []);

  return (
    <section className="space-y-3">
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        Main disciplines
      </h2>

      {sortedRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg bg-v2-surface-container-low p-8 text-center">
          <p className="font-v2-body text-sm text-v2-on-surface-variant">
            No race sessions yet.
          </p>
          <p className="mt-1 font-v2-body text-xs text-v2-on-surface-variant/70">
            Main disciplines appear after race sessions from agent or .ibt
            uploads.
          </p>
        </div>
      ) : (
        <div className="space-y-6 rounded-lg bg-v2-surface-container-low p-5">
          {sortedRows.map((sim) => (
            <div key={sim.sim} className="space-y-2">
              <div className="flex h-8 items-center justify-between">
                <DisciplineLogo sim={sim.sim} />
                <span className="font-v2-body text-[11px] font-bold text-v2-on-surface-variant">
                  {sim.pctOfTotal.toFixed(0)}%
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-v2-outline-variant/20">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    getDisciplineBarClass(sim.sim),
                  )}
                  style={{ width: `${Math.min(100, sim.pctOfTotal)}%` }}
                />
              </div>
              <p className="font-v2-body text-xs text-v2-on-surface-variant">
                {sim.km != null ? `${sim.km} km` : "—"}
              </p>
              <p className="font-v2-body text-xs text-v2-on-surface-variant">
                {sim.pctOfTotal.toFixed(0)}% of total • {sim.sessions} sessions
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
