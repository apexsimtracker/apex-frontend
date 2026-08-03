import AppListPaginationFooter from "@/components/app-ui/AppListPaginationFooter";
import { formatChallengeDateTime } from "@/lib/datetime";
import type { ChallengeLeaderboardRow } from "@/lib/api";
import { formatLapMs } from "@/lib/utils";

interface LeaderboardData {
  items: ChallengeLeaderboardRow[];
  page: number;
  pageSize?: number;
  total: number;
  totalPages: number;
}

interface ChallengeDetailLeaderboardProps {
  loading: boolean;
  data: LeaderboardData | undefined;
  page: number;
  pageSize: number;
  fetching?: boolean;
  onPageChange: (page: number) => void;
}

function SourceLabel({ verification }: { verification: string }) {
  if (verification === "VERIFIED") {
    return (
      <span className="font-apex-body text-apex-success">Verified</span>
    );
  }
  return (
    <span className="font-apex-body text-apex-on-surface-variant">Manual</span>
  );
}

function DriverLabel({ row }: { row: ChallengeLeaderboardRow }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="truncate">{row.username}</span>
      {row.isPro ? (
        <span className="shrink-0 rounded-apex-sm bg-apex-surface-container-highest px-1.5 py-0.5 font-apex-headline text-[10px] font-semibold uppercase tracking-wide text-apex-on-surface-variant">
          Pro
        </span>
      ) : null}
    </span>
  );
}

export default function ChallengeDetailLeaderboard({
  loading,
  data,
  page,
  pageSize,
  fetching = false,
  onPageChange,
}: ChallengeDetailLeaderboardProps) {
  return (
    <div className="rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface">
          Leaderboard
          {data?.total != null && (
            <span className="ml-2 font-apex-body text-sm font-normal text-apex-on-surface-variant">
              ({data.total})
            </span>
          )}
        </h2>
      </div>
      {loading ? (
        <p className="py-4 font-apex-body text-sm text-apex-on-surface-variant">
          Loading…
        </p>
      ) : !data?.items?.length ? (
        <p className="py-4 font-apex-body text-sm text-apex-on-surface-variant">
          No laps recorded yet.
        </p>
      ) : (
        <>
          {/* Desktop / tablet table — min-width keeps columns readable with horizontal scroll */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[36rem] text-left font-apex-body text-sm">
              <thead>
                <tr className="border-b border-apex-outline-variant/15 text-apex-on-surface-variant">
                  <th className="py-2 pr-4 font-apex-body text-[11px] font-medium uppercase tracking-wider">
                    #
                  </th>
                  <th className="py-2 pr-4 font-apex-body text-[11px] font-medium uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="py-2 pr-4 font-apex-body text-[11px] font-medium uppercase tracking-wider">
                    Best lap
                  </th>
                  <th className="py-2 pr-4 font-apex-body text-[11px] font-medium uppercase tracking-wider">
                    Date set
                  </th>
                  <th className="py-2 pr-4 font-apex-body text-[11px] font-medium uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="py-2 font-apex-body text-[11px] font-medium uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr
                    key={`${row.userId}-${row.rank}`}
                    className="border-b border-apex-outline-variant/10"
                  >
                    <td className="py-2 pr-4 tabular-nums text-apex-on-surface">
                      {row.rank}
                    </td>
                    <td className="py-2 pr-4 text-apex-on-surface">
                      <DriverLabel row={row} />
                    </td>
                    <td className="py-2 pr-4 font-mono text-apex-on-surface">
                      {formatLapMs(row.bestLapMs)}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-apex-on-surface-variant">
                      {formatChallengeDateTime(row.bestLapAt)}
                    </td>
                    <td className="py-2 pr-4 text-apex-on-surface">
                      {row.attemptCount}
                    </td>
                    <td className="py-2">
                      <SourceLabel verification={row.verification} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — avoids squished table columns */}
          <ul className="space-y-3 sm:hidden">
            {data.items.map((row) => (
              <li
                key={`${row.userId}-${row.rank}`}
                className="rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-low p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-apex-surface-container-highest font-apex-headline text-xs font-semibold tabular-nums text-apex-on-surface">
                      {row.rank}
                    </span>
                    <span className="min-w-0 font-apex-body text-sm font-medium text-apex-on-surface">
                      <DriverLabel row={row} />
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-apex-on-surface">
                    {formatLapMs(row.bestLapMs)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <p className="font-apex-body uppercase tracking-wider text-apex-on-surface-variant">
                      Date
                    </p>
                    <p className="mt-0.5 font-apex-body text-apex-on-surface">
                      {formatChallengeDateTime(row.bestLapAt)}
                    </p>
                  </div>
                  <div>
                    <p className="font-apex-body uppercase tracking-wider text-apex-on-surface-variant">
                      Attempts
                    </p>
                    <p className="mt-0.5 font-apex-body text-apex-on-surface">
                      {row.attemptCount}
                    </p>
                  </div>
                  <div>
                    <p className="font-apex-body uppercase tracking-wider text-apex-on-surface-variant">
                      Source
                    </p>
                    <p className="mt-0.5">
                      <SourceLabel verification={row.verification} />
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <AppListPaginationFooter
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={pageSize}
            onPageChange={onPageChange}
            disabled={fetching}
            className="mt-4"
          />
        </>
      )}
    </div>
  );
}
