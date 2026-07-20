import { SkeletonBlock } from "@/components/ui/skeleton";
import { formatDuration, cn } from "@/lib/utils";

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatWeekLabel(weekStart: string): string {
  const date = new Date(weekStart);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `Week of ${formatted}`;
}

export type DashboardStatGridProps = {
  loading?: boolean;
  displayName: string;
  weekLabel?: string | null;
  sessionsCount: number;
  totalLaps: number;
  trackTimeMs: number;
  sessionDelta: number;
  lapsDelta: number;
  trackTimeDelta: number;
};

function DeltaText({
  delta,
  displayText,
}: {
  delta: number;
  displayText: string;
}) {
  const improvement = delta === 0 ? null : delta > 0;
  const textColor =
    improvement === null
      ? "text-apex-on-surface-variant/60"
      : improvement
        ? "text-apex-success"
        : "text-apex-error";

  return (
    <span className={cn("text-xs font-bold", textColor)}>{displayText}</span>
  );
}

function formatSessionDelta(delta: number): string {
  if (delta === 0) return "—";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function formatLapsDelta(delta: number): string {
  if (delta === 0) return "—";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function formatTrackTimeDelta(delta: number): string {
  if (delta === 0) return "—";
  return delta > 0
    ? `+${formatDuration(delta)}`
    : `-${formatDuration(Math.abs(delta))}`;
}

export default function DashboardStatGrid({
  loading = false,
  displayName,
  weekLabel,
  sessionsCount,
  totalLaps,
  trackTimeMs,
  sessionDelta,
  lapsDelta,
  trackTimeDelta,
}: DashboardStatGridProps) {
  if (loading) {
    return (
      <section className="space-y-4">
        <div>
          <SkeletonBlock
            height={14}
            width={120}
            className="bg-apex-surface-container-high"
            rounded="sm"
          />
          <SkeletonBlock
            height={32}
            width={240}
            className="mt-2 bg-apex-surface-container-high"
            rounded="md"
          />
        </div>
        <div className="grid grid-cols-3 gap-6 border-y border-apex-outline-variant/15 py-5">
          {([0, 1, 2] as const).map((i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center gap-2",
                i === 1 && "border-x border-apex-outline-variant/15",
              )}
            >
              <SkeletonBlock
                height={10}
                width={56}
                className="bg-apex-surface-container-high"
                rounded="sm"
              />
              <SkeletonBlock
                height={32}
                width={40}
                className="bg-apex-surface-container-high"
                rounded="md"
              />
              <SkeletonBlock
                height={12}
                width={32}
                className="bg-apex-surface-container-high"
                rounded="sm"
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        {weekLabel ? (
          <p className="font-apex-body text-sm font-medium text-apex-on-surface-variant">
            {weekLabel}
          </p>
        ) : null}
        <h1 className="mt-0.5 font-apex-headline text-3xl font-bold text-apex-on-surface">
          {getTimeOfDayGreeting()}, {displayName}
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-6 border-y border-apex-outline-variant/15 py-5">
        <div className="flex flex-col items-center gap-2">
          <p
            className="text-center text-[11px] font-medium uppercase tracking-wider text-apex-on-surface-variant"
            title="All session types — practice, qualifying, and race"
          >
            Sessions
          </p>
          <span className="font-apex-headline text-3xl font-extrabold tabular-nums leading-none text-apex-on-surface">
            {sessionsCount}
          </span>
          <DeltaText
            delta={sessionDelta}
            displayText={formatSessionDelta(sessionDelta)}
          />
        </div>

        <div className="flex flex-col items-center gap-2 border-x border-apex-outline-variant/15">
          <p className="whitespace-nowrap text-center text-[11px] font-medium uppercase tracking-wider text-apex-on-surface-variant">
            Track Time
          </p>
          <span className="font-apex-headline text-3xl font-extrabold tabular-nums leading-none text-apex-on-surface">
            {formatDuration(trackTimeMs)}
          </span>
          <DeltaText
            delta={trackTimeDelta}
            displayText={formatTrackTimeDelta(trackTimeDelta)}
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-apex-on-surface-variant">
            Laps
          </p>
          <span className="font-apex-headline text-3xl font-extrabold tabular-nums leading-none text-apex-on-surface">
            {totalLaps}
          </span>
          <DeltaText
            delta={lapsDelta}
            displayText={formatLapsDelta(lapsDelta)}
          />
        </div>
      </div>
    </section>
  );
}
