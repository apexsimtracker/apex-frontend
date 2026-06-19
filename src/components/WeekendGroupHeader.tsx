import { formatTrackName } from "@/lib/tracks";
import { cn } from "@/lib/utils";
import type { ActivityFeedWeekendGroup } from "@/lib/api/activityBilling";

const PILL_STYLES = {
  P: { color: "#888888", background: "rgba(136, 136, 136, 0.18)" },
  Q: { color: "#9B59FF", background: "rgba(155, 89, 255, 0.18)" },
  R: { color: "#E8172B", background: "rgba(232, 23, 43, 0.18)" },
} as const;

type WeekendGroupHeaderProps = {
  group: ActivityFeedWeekendGroup;
  className?: string;
};

function SessionPill({ label, kind }: { label: string; kind: keyof typeof PILL_STYLES }) {
  const style = PILL_STYLES[kind];
  return (
    <span
      className="inline-flex size-6 items-center justify-center rounded-full text-xs font-bold"
      style={{
        color: style.color,
        backgroundColor: style.background,
        border: `1px solid ${style.color}44`,
      }}
      aria-label={
        kind === "P" ? "Practice session" : kind === "Q" ? "Qualifying session" : "Race session"
      }
    >
      {label}
    </span>
  );
}

export default function WeekendGroupHeader({ group, className = "" }: WeekendGroupHeaderProps) {
  const trackDisplay = formatTrackName(group.trackName);

  return (
    <div
      className={cn(
        "mb-3 rounded-lg border border-white/8 px-4 py-3 sm:px-5",
        className
      )}
      aria-label={`Race weekend at ${trackDisplay}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white sm:text-lg">
            {trackDisplay}
          </h3>
          <p className="mt-0.5 text-xs text-white/50">{group.date}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden={!group.weekendSummary}>
          {group.hasPractice && <SessionPill label="P" kind="P" />}
          {group.hasQualifying && <SessionPill label="Q" kind="Q" />}
          {group.hasRace && <SessionPill label="R" kind="R" />}
        </div>
      </div>
      {group.weekendSummary ? (
        <p className="sr-only">{group.weekendSummary}</p>
      ) : null}
    </div>
  );
}
