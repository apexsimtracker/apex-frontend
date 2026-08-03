import SimBadge from "@/components/SimBadge";
import SessionTypeTag from "@/components/SessionTypeTag";
import { ProfilePositionBadge } from "@/components/profile/ProfilePositionBadge";
import DiscussionCommentsPagination from "@/pages/discussion/DiscussionCommentsPagination";
import { formatLapMs, formatCarName, formatTrackName } from "@/lib/utils";
import { getSimShortName } from "@/lib/sim";

type RaceRow = {
  id: string;
  date: string;
  sim: string;
  car: string;
  track: string;
  position: number | null;
  qualiPos: number | null;
  bestLapMs: number | null;
  source?: string | null;
  manualSessionKind?: string | null;
};

function formatRaceDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function RaceSessionBadges({ race }: { race: RaceRow }) {
  const isManual = race.source === "MANUAL_ACTIVITY";
  if (!isManual) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <SessionTypeTag
        sessionType={race.source}
        manualSessionKind={race.manualSessionKind}
      />
    </div>
  );
}

type ProfileRaceHistoryProps = {
  raceHistory: RaceRow[];
  raceHistoryLoading: boolean;
  emptyMessage: string;
  onOpenSession: (sessionId: string) => void;
  range: { start: number; end: number } | null;
  pagination?: {
    page: number;
    totalPages: number;
    disabled: boolean;
    onPageChange: (page: number) => void;
    total: number;
  };
};

export function ProfileRaceHistory({
  raceHistory,
  raceHistoryLoading,
  emptyMessage,
  onOpenSession,
  range,
  pagination,
}: ProfileRaceHistoryProps) {
  const total = pagination?.total ?? raceHistory.length;

  const thClass =
    "py-2 text-[10px] font-bold uppercase tracking-wider text-apex-on-surface-variant";

  return (
    <section className="space-y-3">
      <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface">
        Race History
      </h2>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-apex-outline-variant/15">
              <th className={thClass}>Track</th>
              <th className={thClass}>Sim</th>
              <th className={thClass}>Car</th>
              <th className={thClass}>Pos</th>
              <th className={`${thClass} text-right`}>Best Lap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-apex-outline-variant/5">
            {raceHistoryLoading && raceHistory.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center font-apex-body text-sm text-apex-on-surface-variant"
                >
                  Loading race history…
                </td>
              </tr>
            ) : raceHistory.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center font-apex-body text-sm text-apex-on-surface-variant"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              raceHistory.map((race) => (
                <tr
                  key={race.id}
                  onClick={() => onOpenSession(race.id)}
                  className="cursor-pointer transition-colors hover:bg-apex-surface-container-low/50"
                >
                  <td className="whitespace-nowrap py-4 align-middle">
                    <div className="flex flex-col justify-center">
                      <span className="font-apex-body text-xs font-bold text-apex-on-surface">
                        {formatTrackName(race.track)}
                      </span>
                      <span className="font-apex-body text-[9px] text-apex-on-surface-variant">
                        {formatRaceDate(race.date)}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <SimBadge sim={race.sim} size="sm" />
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <span className="font-apex-body text-xs font-medium text-apex-on-surface">
                      {formatCarName(race.car)}
                    </span>
                    <RaceSessionBadges race={race} />
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <ProfilePositionBadge position={race.position} />
                  </td>
                  <td className="whitespace-nowrap py-4 text-right align-middle">
                    <span className="font-apex-body text-xs font-medium text-apex-on-surface">
                      {formatLapMs(race.bestLapMs)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {raceHistoryLoading && raceHistory.length === 0 ? (
          <div className="py-10 text-center font-apex-body text-sm text-apex-on-surface-variant">
            Loading race history…
          </div>
        ) : raceHistory.length === 0 ? (
          <div className="py-10 text-center font-apex-body text-sm text-apex-on-surface-variant">
            {emptyMessage}
          </div>
        ) : (
          raceHistory.map((race) => (
            <div
              key={race.id}
              onClick={() => onOpenSession(race.id)}
              className="cursor-pointer rounded-lg border border-apex-outline-variant/15 bg-apex-surface-container-low p-4 transition-colors hover:bg-apex-surface-container"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-apex-body text-xs font-bold text-apex-on-surface">
                    {formatTrackName(race.track)}
                  </p>
                  <p className="font-apex-body text-[9px] text-apex-on-surface-variant">
                    {formatRaceDate(race.date)}
                  </p>
                </div>
                <ProfilePositionBadge position={race.position} />
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-apex-body text-[10px] uppercase text-apex-on-surface-variant">
                      Sim
                    </p>
                    <p className="font-apex-body font-medium text-apex-on-surface">
                      {getSimShortName(race.sim)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-apex-body text-[10px] uppercase text-apex-on-surface-variant">
                      Best Lap
                    </p>
                    <p className="font-apex-body font-medium text-apex-on-surface">
                      {formatLapMs(race.bestLapMs)}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-apex-body text-[10px] uppercase text-apex-on-surface-variant">
                    Car
                  </p>
                  <p className="truncate font-apex-body font-medium text-apex-on-surface">
                    {formatCarName(race.car)}
                  </p>
                </div>
              </div>
              <RaceSessionBadges race={race} />
            </div>
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 space-y-3">
          {range && total > 0 && (
            <p className="text-center font-apex-body text-xs text-apex-on-surface-variant">
              Showing {range.start}–{range.end} of {total}
            </p>
          )}
          <DiscussionCommentsPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            disabled={pagination.disabled}
          />
        </div>
      )}
    </section>
  );
}
