import { formatAvgFinishOneDecimal } from "@/lib/utils";

type ProfileKeyStatsProps = {
  profileLocked: boolean;
  races: number;
  wins: number | null | undefined;
  podiums: number | null | undefined;
  poles: number | null | undefined;
  fastestLaps: number;
  avgFinish: number | null | undefined;
};

export function ProfileKeyStats({
  profileLocked,
  races,
  wins,
  podiums,
  poles,
  fastestLaps,
  avgFinish,
}: ProfileKeyStatsProps) {
  const safeValue = (v: number | null | undefined) =>
    v === null || v === undefined ? "—" : v;

  if (profileLocked) {
    return (
      <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-center text-sm text-muted-foreground">
        Stats are hidden because this profile is private. Follow this account to
        see sessions and results when your request is approved.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-5">
      <div className="text-center sm:text-left">
        <p className="mb-1 text-xs uppercase text-muted-foreground/50">Races</p>
        <p className="text-sm font-semibold text-foreground sm:text-base">
          {races}
        </p>
      </div>
      <div className="text-center sm:text-left">
        <p className="mb-1 text-xs uppercase text-muted-foreground/50">Wins</p>
        <p className="text-sm font-semibold text-yellow-200 sm:text-base">
          {safeValue(wins)}
        </p>
      </div>
      <div className="text-center sm:text-left">
        <p className="mb-1 text-xs uppercase text-muted-foreground/50">
          Podiums
        </p>
        <p className="text-sm font-semibold text-foreground sm:text-base">
          {safeValue(podiums)}
        </p>
      </div>
      <div className="text-center sm:text-left">
        <p className="mb-1 text-xs uppercase text-muted-foreground/50">Poles</p>
        <p className="text-sm font-semibold text-foreground sm:text-base">
          {safeValue(poles)}
        </p>
      </div>
      <div className="text-center sm:text-left">
        <p className="mb-1 text-xs uppercase text-muted-foreground/50">FL</p>
        <p className="text-sm font-semibold text-foreground sm:text-base">
          {fastestLaps}
        </p>
      </div>
      <div className="text-center sm:text-left">
        <p className="mb-1 text-xs uppercase text-muted-foreground/50">Avg</p>
        <p className="text-sm font-semibold text-foreground sm:text-base">
          {formatAvgFinishOneDecimal(avgFinish)}
        </p>
      </div>
    </div>
  );
}
