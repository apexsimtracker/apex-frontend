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

export default function ChallengeDetailLeaderboard({
  loading,
  data,
  page,
  pageSize,
  fetching = false,
  onPageChange,
}: ChallengeDetailLeaderboardProps) {
  return (
    <div className="rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container p-6">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left font-apex-body text-sm">
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
                      <span className="inline-flex items-center gap-2">
                        {row.username}
                        {row.isPro && (
                          <span className="rounded-apex-sm bg-apex-surface-container-highest px-1.5 py-0.5 font-apex-headline text-[10px] font-semibold uppercase tracking-wide text-apex-on-surface-variant">
                            Pro
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-mono text-apex-on-surface">
                      {formatLapMs(row.bestLapMs)}
                    </td>
                    <td className="py-2 pr-4 text-apex-on-surface-variant">
                      {formatChallengeDateTime(row.bestLapAt)}
                    </td>
                    <td className="py-2 pr-4 text-apex-on-surface">
                      {row.attemptCount}
                    </td>
                    <td className="py-2">
                      {row.verification === "VERIFIED" ? (
                        <span className="font-apex-body text-apex-success">
                          Verified
                        </span>
                      ) : (
                        <span className="font-apex-body text-apex-on-surface-variant">
                          Manual
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
