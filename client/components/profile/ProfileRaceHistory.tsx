import { CheckCircle } from "lucide-react";
import SimBadge from "@/components/SimBadge";
import { RaceHistoryPagination } from "@/components/RaceHistoryPagination";
import { formatLapMs, formatCarName, formatTrackName } from "@/lib/utils";

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
};

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

  return (
    <>
      <h2 className="mb-8 text-2xl font-bold text-foreground">Race History</h2>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                SIM
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Car
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Track
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Position
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Quali Pos
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Best Lap
              </th>
            </tr>
          </thead>
          <tbody>
            {raceHistoryLoading && raceHistory.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Loading race history…
                </td>
              </tr>
            ) : raceHistory.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-neutral-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              raceHistory.map((race) => (
                <tr
                  key={race.id}
                  onClick={() => onOpenSession(race.id)}
                  className="cursor-pointer border transition-colors hover:bg-secondary"
                >
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(race.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <SimBadge sim={race.sim} size="md" />
                      {race.source === "MANUAL_ACTIVITY" && (
                        <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white/60">
                          Manual
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatCarName(race.car)}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{formatTrackName(race.track)}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                        race.position === 1
                          ? "bg-yellow-50 text-gold dark:bg-yellow-950/20"
                          : race.position === 2
                            ? "bg-gray-100 text-silver dark:bg-gray-800/40"
                            : race.position === 3
                              ? "bg-orange-50 text-bronze dark:bg-orange-950/20"
                              : "bg-secondary text-foreground"
                      }`}
                    >
                      {race.position ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-bold text-foreground">{race.qualiPos ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                    {formatLapMs(race.bestLapMs)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 md:hidden">
        {raceHistoryLoading && raceHistory.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading race history…</div>
        ) : raceHistory.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400">{emptyMessage}</div>
        ) : (
          raceHistory.map((race) => (
            <div
              key={race.id}
              onClick={() => onOpenSession(race.id)}
              className="border/40 cursor-pointer rounded-lg border p-4 transition-colors hover:bg-secondary/20"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <SimBadge sim={race.sim} size="md" />
                    {race.source === "MANUAL_ACTIVITY" && (
                      <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white/60">
                        Manual
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{new Date(race.date).toLocaleDateString()}</p>
                </div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                    race.position === 1
                      ? "bg-yellow-50 text-gold dark:bg-yellow-950/20"
                      : race.position === 2
                        ? "bg-gray-100 text-silver dark:bg-gray-800/40"
                        : race.position === 3
                          ? "bg-orange-50 text-bronze dark:bg-orange-950/20"
                          : "bg-secondary text-foreground"
                  }`}
                >
                  P{race.position ?? "—"}
                </span>
              </div>
              <div className="mb-3">
                <p className="text-sm font-semibold text-foreground">{formatTrackName(race.track)}</p>
                <p className="text-xs text-muted-foreground">{formatCarName(race.car)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Quali</p>
                  <p className="font-bold text-foreground">{race.qualiPos ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Best Lap</p>
                  <p className="font-bold text-foreground">
                    {race.bestLapMs != null ? formatLapMs(race.bestLapMs) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{race.source === "MANUAL_ACTIVITY" ? "Manual" : "Status"}</p>
                  <p className="font-bold text-foreground">
                    {race.source === "MANUAL_ACTIVITY" ? (
                      "—"
                    ) : (
                      <CheckCircle
                        className="inline-block size-5 text-green-600 dark:text-green-500"
                        aria-label="Completed"
                      />
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination && total > 0 && (
        <div className="mt-6 space-y-3">
          {range && (
            <p className="text-center text-xs text-muted-foreground">
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
    </>
  );
}

