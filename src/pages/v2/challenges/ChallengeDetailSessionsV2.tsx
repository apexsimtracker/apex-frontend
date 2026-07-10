import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { v2OutlineButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import type { EntrantSessionRow } from "@/lib/api";
import { cn, formatLapMs } from "@/lib/utils";

interface SessionsData {
  items: EntrantSessionRow[];
  page: number;
  total: number;
  totalPages: number;
}

interface ChallengeDetailSessionsV2Props {
  signedIn: boolean;
  loading: boolean;
  data: SessionsData | undefined;
  page: number;
  onPageChange: (page: number) => void;
}

export default function ChallengeDetailSessionsV2({
  signedIn,
  loading,
  data,
  page,
  onPageChange,
}: ChallengeDetailSessionsV2Props) {
  return (
    <div className="rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
          Session details
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
      {!signedIn ? (
        <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
          Sign in to browse entrants&apos; sessions.
        </p>
      ) : loading ? (
        <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
          Loading…
        </p>
      ) : !data?.items?.length ? (
        <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
          No linked sessions yet.
        </p>
      ) : (
        <>
          <ul className="space-y-3 font-v2-body text-sm">
            {data.items.map((row) => (
              <li
                key={row.userId}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-v2-outline-variant/10 py-2"
              >
                <span className="text-v2-on-surface">{row.username}</span>
                <span className="font-mono text-v2-on-surface-variant">
                  {formatLapMs(row.bestLapMs)}
                </span>
                {row.sessionId ? (
                  <Link
                    to={`/v2/sessions/${row.sessionId}`}
                    className="text-v2-primary transition-colors hover:text-v2-primary/80"
                  >
                    View session
                  </Link>
                ) : (
                  <span className="text-v2-on-surface-variant">—</span>
                )}
              </li>
            ))}
          </ul>
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
