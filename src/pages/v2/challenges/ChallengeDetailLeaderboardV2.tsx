import { ChevronLeft, ChevronRight } from "lucide-react";
import { v2OutlineButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { formatChallengeDateTime } from "@/lib/datetime";
import type { ChallengeLeaderboardRow } from "@/lib/api";
import { cn, formatLapMs } from "@/lib/utils";

interface LeaderboardData {
  items: ChallengeLeaderboardRow[];
  page: number;
  total: number;
  totalPages: number;
}

interface ChallengeDetailLeaderboardV2Props {
  loading: boolean;
  data: LeaderboardData | undefined;
  page: number;
  onPageChange: (page: number) => void;
}

export default function ChallengeDetailLeaderboardV2({
  loading,
  data,
  page,
  onPageChange,
}: ChallengeDetailLeaderboardV2Props) {
  return (
    <div className="rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
          Leaderboard
          {data?.total != null && (
            <span className="ml-2 font-v2-body text-sm font-normal text-v2-on-surface-variant">
              ({data.total})
            </span>
          )}
        </h2>
        {data && data.totalPages > 1 && (
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            Page {data.page} / {data.totalPages}
          </p>
        )}
      </div>
      {loading ? (
        <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
          Loading…
        </p>
      ) : !data?.items?.length ? (
        <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
          No laps recorded yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-v2-body text-sm">
              <thead>
                <tr className="border-b border-v2-outline-variant/15 text-v2-on-surface-variant">
                  <th className="py-2 pr-4 font-v2-body text-[11px] font-medium uppercase tracking-wider">
                    #
                  </th>
                  <th className="py-2 pr-4 font-v2-body text-[11px] font-medium uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="py-2 pr-4 font-v2-body text-[11px] font-medium uppercase tracking-wider">
                    Best lap
                  </th>
                  <th className="py-2 pr-4 font-v2-body text-[11px] font-medium uppercase tracking-wider">
                    Date set
                  </th>
                  <th className="py-2 pr-4 font-v2-body text-[11px] font-medium uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="py-2 font-v2-body text-[11px] font-medium uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr
                    key={`${row.userId}-${row.rank}`}
                    className="border-b border-v2-outline-variant/10"
                  >
                    <td className="py-2 pr-4 tabular-nums text-v2-on-surface">
                      {row.rank}
                    </td>
                    <td className="py-2 pr-4 text-v2-on-surface">
                      <span className="inline-flex items-center gap-2">
                        {row.username}
                        {row.isPro && (
                          <span className="rounded-v2-sm bg-v2-surface-container-highest px-1.5 py-0.5 font-v2-headline text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
                            Pro
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-mono text-v2-on-surface">
                      {formatLapMs(row.bestLapMs)}
                    </td>
                    <td className="py-2 pr-4 text-v2-on-surface-variant">
                      {formatChallengeDateTime(row.bestLapAt)}
                    </td>
                    <td className="py-2 pr-4 text-v2-on-surface">
                      {row.attemptCount}
                    </td>
                    <td className="py-2">
                      {row.verification === "VERIFIED" ? (
                        <span className="font-v2-body text-v2-success">
                          Verified
                        </span>
                      ) : (
                        <span className="font-v2-body text-v2-on-surface-variant">
                          Manual
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(Math.max(1, page - 1))}
                className={cn(
                  v2OutlineButtonClassName,
                  "inline-flex items-center gap-1 px-3 py-2 font-v2-body text-sm font-medium",
                )}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() =>
                  onPageChange(Math.min(data.totalPages, page + 1))
                }
                className={cn(
                  v2OutlineButtonClassName,
                  "inline-flex items-center gap-1 px-3 py-2 font-v2-body text-sm font-medium",
                )}
              >
                Next
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
