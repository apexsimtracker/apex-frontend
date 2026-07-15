import { formatAvgFinishOneDecimal } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ProfileKeyStatsV2Props = {
  profileLocked: boolean;
  races: number;
  wins: number | null | undefined;
  podiums: number | null | undefined;
  poles: number | null | undefined;
  fastestLaps: number;
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
        "space-y-0.5 lg:rounded-xl lg:border lg:border-v2-outline-variant/15 lg:bg-v2-surface-container-low lg:p-4 lg:text-left lg:shadow-lg",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
    >
      <p className="font-v2-body text-[10px] uppercase tracking-wider text-v2-on-surface-variant">
        {label}
      </p>
      <span className="font-v2-headline text-3xl font-bold text-v2-on-surface">
        {value}
      </span>
    </div>
  );
}

export function ProfileKeyStatsV2({
  profileLocked,
  races,
  wins,
  podiums,
  poles,
  fastestLaps,
  avgFinish,
}: ProfileKeyStatsV2Props) {
  const safeValue = (v: number | null | undefined) =>
    v === null || v === undefined ? "—" : v;

  if (profileLocked) {
    return (
      <div className="rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container-low px-4 py-3 text-center font-v2-body text-sm text-v2-on-surface-variant">
        Stats are hidden because this profile is private. Follow this account to
        see sessions and results when your request is approved.
      </div>
    );
  }

  return (
    <section className="grid grid-cols-3 gap-y-2 border-y border-v2-outline-variant/15 py-4 lg:gap-3 lg:border-0 lg:py-0">
      <StatCell label="Races" value={races} align="left" />
      <StatCell label="Wins" value={safeValue(wins)} align="center" />
      <StatCell label="Podiums" value={safeValue(podiums)} align="right" />
      <StatCell label="Poles" value={safeValue(poles)} align="left" />
      <StatCell label="Fastest Laps" value={fastestLaps} align="center" />
      <StatCell
        label="Avg Finish"
        value={formatAvgFinishOneDecimal(avgFinish)}
        align="right"
      />
    </section>
  );
}
