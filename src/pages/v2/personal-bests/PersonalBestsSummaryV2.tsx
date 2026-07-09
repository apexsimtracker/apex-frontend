import type { PersonalBestsStats } from "@/lib/api";
import { cn } from "@/lib/utils";

type PersonalBestsSummaryV2Props = {
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
      <p className="font-v2-body text-[10px] uppercase tracking-wider text-v2-on-surface-variant">
        {label}
      </p>
      <span className="font-v2-headline text-3xl font-bold tabular-nums text-v2-on-surface">
        {value}
      </span>
    </div>
  );
}

export default function PersonalBestsSummaryV2({
  stats,
}: PersonalBestsSummaryV2Props) {
  return (
    <section className="mb-6 grid grid-cols-3 gap-y-2 border-y border-v2-outline-variant/15 py-4">
      <StatCell label="Total PBs" value={stats.totalPbs} align="left" />
      <StatCell label="Tracks" value={stats.uniqueTracks} align="center" />
      <StatCell label="Cars" value={stats.uniqueCars} align="right" />
    </section>
  );
}
