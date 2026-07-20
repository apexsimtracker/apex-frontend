import type { PersonalBestsStats } from "@/lib/api";
import { cn } from "@/lib/utils";

type PersonalBestsSummaryProps = {
  stats: PersonalBestsStats;
};

type StatCellProps = {
  label: string;
  value: number;
  align?: "left" | "center" | "right";
};

function StatCell({ label, value, align = "left" }: StatCellProps) {
  return (
    <div
      className={cn(
        "space-y-0.5",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
    >
      <p className="font-apex-body text-[10px] uppercase tracking-wider text-apex-on-surface-variant">
        {label}
      </p>
      <span className="font-apex-headline text-3xl font-bold tabular-nums text-apex-on-surface">
        {value}
      </span>
    </div>
  );
}

export default function PersonalBestsSummary({
  stats,
}: PersonalBestsSummaryProps) {
  return (
    <section className="mb-6 grid grid-cols-3 gap-y-2 border-y border-apex-outline-variant/15 py-4">
      <StatCell label="Total PBs" value={stats.totalPbs} align="left" />
      <StatCell label="Tracks" value={stats.uniqueTracks} align="center" />
      <StatCell label="Cars" value={stats.uniqueCars} align="right" />
    </section>
  );
}
