import { formatAvgFinishOneDecimal } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ProfileKeyStatsProps = {
  profileLocked: boolean;
  races: number;
  wins: number | null | undefined;
  podiums: number | null | undefined;
  poles: number | null | undefined;
  totalLaps: number;
  avgFinish: number | null | undefined;
};

type StatCellProps = {
  label: string;
  value: string | number;
  align?: "left" | "center" | "right";
};

function StatCell({ label, value, align = "left" }: StatCellProps) {
  return (
    <div
      className={cn(
        "space-y-0.5 lg:rounded-xl lg:border lg:border-apex-outline-variant/15 lg:bg-apex-surface-container-low lg:p-4 lg:text-left lg:shadow-lg",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
    >
      <p className="font-apex-body text-[10px] uppercase tracking-wider text-apex-on-surface-variant">
        {label}
      </p>
      <span className="font-apex-headline text-3xl font-bold text-apex-on-surface">
        {value}
      </span>
    </div>
  );
}

export function ProfileKeyStats({
  profileLocked,
  races,
  wins,
  podiums,
  poles,
  totalLaps,
  avgFinish,
}: ProfileKeyStatsProps) {
  const safeValue = (v: number | null | undefined) =>
    v === null || v === undefined ? "—" : v;

  if (profileLocked) {
    return (
      <div className="rounded-lg border border-apex-outline-variant/15 bg-apex-surface-container-low px-4 py-3 text-center font-apex-body text-sm text-apex-on-surface-variant">
        Stats are hidden because this profile is private. Follow this account to
        see sessions and results when your request is approved.
      </div>
    );
  }

  return (
    <section className="grid grid-cols-3 gap-y-2 border-y border-apex-outline-variant/15 py-4 lg:gap-3 lg:border-0 lg:py-0">
      <StatCell label="Races" value={races} align="left" />
      <StatCell label="Wins" value={safeValue(wins)} align="center" />
      <StatCell label="Podiums" value={safeValue(podiums)} align="right" />
      <StatCell label="Poles" value={safeValue(poles)} align="left" />
      <StatCell label="Laps" value={totalLaps} align="center" />
      <StatCell
        label="Avg Finish"
        value={formatAvgFinishOneDecimal(avgFinish)}
        align="right"
      />
    </section>
  );
}
