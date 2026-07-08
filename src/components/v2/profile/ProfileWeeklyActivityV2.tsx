import { useState } from "react";
import type {
  WeeklyGoalsSummary,
  ProfileSummary,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type WeeklyBuckets = {
  Mon: number;
  Tue: number;
  Wed: number;
  Thu: number;
  Fri: number;
  Sat: number;
  Sun: number;
};

type ProfileWeeklyActivityV2Props = {
  weeklySnapshot?: ProfileSummary["weeklySnapshot"];
  weeklyGoals?: WeeklyGoalsSummary;
  totalRaces: number;
  buckets: WeeklyBuckets;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DONUT_RADIUS = 24;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DEFAULT_SIM_TIME_TARGET_HOURS = 10;

function formatHoursFromSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0h";
  const hours = seconds / 3600;
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

function formatHoursShort(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return "0h";
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

function progressPct(current: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.min(100, Math.max(0, (current / target) * 100));
}

type ProgressRowProps = {
  label: string;
  value: string;
  suffix?: string;
  pct: number;
};

function ProgressRow({ label, value, suffix, pct }: ProgressRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-end justify-between">
        <p className="font-v2-body text-[9px] font-bold uppercase tracking-wider text-v2-on-surface-variant">
          {label}
        </p>
        <span className="font-v2-body text-xs font-bold text-v2-on-surface">
          {value}
          {suffix ? (
            <span className="text-[10px] font-normal text-v2-on-surface-variant">
              {" "}
              {suffix}
            </span>
          ) : null}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-v2-surface-container-highest">
        <div
          className="h-full rounded-full bg-v2-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WeeklyActivityChart({
  weeklyValues,
  maxWeekly,
  weeklyTotal,
  hoveredDay,
  setHoveredDay,
}: {
  weeklyValues: number[];
  maxWeekly: number;
  weeklyTotal: number;
  hoveredDay: string | null;
  setHoveredDay: (day: string | null) => void;
}) {
  if (weeklyTotal === 0) return null;

  return (
    <div className="border-t border-v2-outline-variant/15 pt-5">
      <div className="flex h-36 items-end justify-between gap-1.5 sm:gap-2">
        {DAYS.map((day, i) => {
          const value = weeklyValues[i] ?? 0;
          const heightPct = maxWeekly > 0 ? (value / maxWeekly) * 100 : 0;
          const isHovered = hoveredDay === day;

          return (
            <div key={day} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-28 w-full items-end justify-center">
                <button
                  type="button"
                  aria-label={`${day}: ${value} races`}
                  className={cn(
                    "group relative w-full cursor-pointer rounded-v2-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/50",
                    value === 0 && "min-h-[2px] bg-v2-surface-container-highest/60",
                  )}
                  style={
                    value > 0
                      ? {
                          height: `${Math.max(heightPct, 4)}%`,
                          background:
                            "linear-gradient(to top, hsl(var(--v2-primary)), hsl(var(--v2-primary) / 0.55))",
                        }
                      : { height: "2px" }
                  }
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onFocus={() => setHoveredDay(day)}
                  onBlur={() => setHoveredDay(null)}
                >
                  {isHovered && value > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-v2-sm bg-v2-primary/20 p-1">
                      <p className="font-v2-body text-[10px] font-bold text-v2-on-surface">
                        {day}
                      </p>
                      <p className="font-v2-body text-[10px] text-v2-on-surface-variant">
                        {value} races
                      </p>
                    </div>
                  )}
                </button>
              </div>
              <span className="font-v2-body text-[10px] font-medium text-v2-on-surface-variant">
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProfileWeeklyActivityV2({
  weeklySnapshot,
  weeklyGoals,
  totalRaces,
  buckets,
}: ProfileWeeklyActivityV2Props) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const weeklyValues = DAYS.map((day) => buckets[day] ?? 0);
  const weeklyTotal = weeklyValues.reduce((a, b) => a + b, 0);
  const maxWeekly = Math.max(...weeklyValues, 1);

  const trackTimeSec = weeklySnapshot?.trackTimeSec ?? 0;
  const lapsCurrent = weeklyGoals?.laps.current ?? weeklySnapshot?.laps ?? 0;
  const lapsTarget = weeklyGoals?.laps.target ?? 200;
  const simTimeHours = trackTimeSec / 3600;
  const simTimeTargetHours = DEFAULT_SIM_TIME_TARGET_HOURS;

  const hasActivity =
    totalRaces > 0 ||
    trackTimeSec > 0 ||
    lapsCurrent > 0 ||
    weeklyTotal > 0 ||
    (weeklySnapshot?.sessions ?? 0) > 0;

  const donutPct = progressPct(simTimeHours, simTimeTargetHours);
  const donutOffset =
    DONUT_CIRCUMFERENCE - (donutPct / 100) * DONUT_CIRCUMFERENCE;
  const lapsPct = progressPct(lapsCurrent, lapsTarget);
  const simTimePct = progressPct(simTimeHours, simTimeTargetHours);

  return (
    <section className="space-y-3">
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        Weekly activity
      </h2>

      {!hasActivity ? (
        <div className="flex flex-col items-center justify-center rounded-lg bg-v2-surface-container-low p-8 text-center">
          <p className="font-v2-body text-sm text-v2-on-surface-variant">
            No sessions this week yet.
          </p>
          <p className="mt-1 font-v2-body text-xs text-v2-on-surface-variant/70">
            Run a session to start building your weekly activity.
          </p>
        </div>
      ) : (
        <div className="space-y-5 rounded-lg bg-v2-surface-container-low p-5">
          <div className="flex flex-col items-center gap-8 sm:flex-row">
            <div className="relative flex size-20 shrink-0 items-center justify-center">
              <svg
                className="size-20 -rotate-90"
                viewBox="0 0 56 56"
                aria-hidden
              >
                <circle
                  cx="28"
                  cy="28"
                  r={DONUT_RADIUS}
                  fill="transparent"
                  stroke="hsl(var(--v2-surface-container-highest))"
                  strokeWidth="4"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={DONUT_RADIUS}
                  fill="transparent"
                  stroke="hsl(var(--v2-primary))"
                  strokeWidth="4"
                  strokeDasharray={DONUT_CIRCUMFERENCE}
                  strokeDashoffset={donutOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-v2-body text-sm font-bold text-v2-on-surface">
                  {formatHoursFromSeconds(trackTimeSec)}
                </span>
                <span className="font-v2-body text-[7px] font-bold uppercase tracking-tighter text-v2-on-surface-variant">
                  Total
                </span>
              </div>
            </div>

            <div className="w-full flex-1 space-y-4">
              <ProgressRow
                label="Laps Driven"
                value={String(Math.round(lapsCurrent))}
                pct={lapsPct}
              />
              <ProgressRow
                label="Sim time"
                value={formatHoursShort(simTimeHours)}
                suffix={`/ ${simTimeTargetHours}h`}
                pct={simTimePct}
              />
            </div>
          </div>

          <WeeklyActivityChart
            weeklyValues={weeklyValues}
            maxWeekly={maxWeekly}
            weeklyTotal={weeklyTotal}
            hoveredDay={hoveredDay}
            setHoveredDay={setHoveredDay}
          />
        </div>
      )}
    </section>
  );
}
