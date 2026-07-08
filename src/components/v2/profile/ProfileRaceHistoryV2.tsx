import SimBadge from "@/components/SimBadge";
import SessionTypeTag from "@/components/SessionTypeTag";
import { RaceHistoryPagination } from "@/components/RaceHistoryPagination";
import { ProfilePositionBadgeV2 } from "@/components/v2/profile/ProfilePositionBadgeV2";
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

type ProfileRaceHistoryV2Props = {
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

export function ProfileRaceHistoryV2({
  raceHistory,
  raceHistoryLoading,
  emptyMessage,
  onOpenSession,
  range,
  pagination,
}: ProfileRaceHistoryV2Props) {
  const total = pagination?.total ?? raceHistory.length;

  const thClass =
    "py-2 text-[10px] font-bold uppercase tracking-wider text-v2-on-surface-variant";

  return (
    <section className="space-y-3">
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        Race History
      </h2>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-v2-outline-variant/15">
              <th className={thClass}>Track</th>
              <th className={thClass}>Sim</th>
              <th className={thClass}>Car</th>
              <th className={thClass}>Pos</th>
              <th className={`${thClass} text-right`}>Best Lap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-v2-outline-variant/5">
            {raceHistoryLoading && raceHistory.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center font-v2-body text-sm text-v2-on-surface-variant"
                >
                  Loading race history…
                </td>
              </tr>
            ) : raceHistory.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center font-v2-body text-sm text-v2-on-surface-variant"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              raceHistory.map((race) => (
                <tr
                  key={race.id}
                  onClick={() => onOpenSession(race.id)}
                  className="cursor-pointer transition-colors hover:bg-v2-surface-container-low/50"
                >
                  <td className="whitespace-nowrap py-4 align-middle">
                    <div className="flex flex-col justify-center">
                      <span className="font-v2-body text-xs font-bold text-v2-on-surface">
                        {formatTrackName(race.track)}
                      </span>
                      <span className="font-v2-body text-[9px] text-v2-on-surface-variant">
                        {formatRaceDate(race.date)}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <SimBadge sim={race.sim} size="sm" />
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <span className="font-v2-body text-xs font-medium text-v2-on-surface">
                      {formatCarName(race.car)}
                    </span>
                    <RaceSessionBadges race={race} />
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <ProfilePositionBadgeV2 position={race.position} />
                  </td>
                  <td className="whitespace-nowrap py-4 text-right align-middle">
                    <span className="font-v2-body text-xs font-medium text-v2-on-surface">
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
          <div className="py-10 text-center font-v2-body text-sm text-v2-on-surface-variant">
            Loading race history…
          </div>
        ) : raceHistory.length === 0 ? (
          <div className="py-10 text-center font-v2-body text-sm text-v2-on-surface-variant">
            {emptyMessage}
          </div>
        ) : (
          raceHistory.map((race) => (
            <div
              key={race.id}
              onClick={() => onOpenSession(race.id)}
              className="cursor-pointer rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-4 transition-colors hover:bg-v2-surface-container"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-v2-body text-xs font-bold text-v2-on-surface">
                    {formatTrackName(race.track)}
                  </p>
                  <p className="font-v2-body text-[9px] text-v2-on-surface-variant">
                    {formatRaceDate(race.date)}
                  </p>
                </div>
                <ProfilePositionBadgeV2 position={race.position} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
                    Sim
                  </p>
                  <p className="font-v2-body font-medium text-v2-on-surface">
                    {getSimShortName(race.sim)}
                  </p>
                </div>
                <div>
                  <p className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
                    Car
                  </p>
                  <p className="font-v2-body font-medium text-v2-on-surface">
                    {formatCarName(race.car)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
                    Best Lap
                  </p>
                  <p className="font-v2-body font-medium text-v2-on-surface">
                    {formatLapMs(race.bestLapMs)}
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
            <p className="text-center font-v2-body text-xs text-v2-on-surface-variant">
              Showing {range.start}–{range.end} of {total}
            </p>
          )}
          <RaceHistoryPagination
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
