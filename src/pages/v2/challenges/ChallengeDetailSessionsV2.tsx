import { Link } from "react-router-dom";
import V2ListPaginationFooter from "@/components/v2/ui/V2ListPaginationFooter";
import type { EntrantSessionRow } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import { formatLapMs } from "@/lib/utils";

interface SessionsData {
  items: EntrantSessionRow[];
  page: number;
  pageSize?: number;
  total: number;
  totalPages: number;
}

interface ChallengeDetailSessionsV2Props {
  signedIn: boolean;
  loading: boolean;
  data: SessionsData | undefined;
  error?: unknown;
  page: number;
  pageSize: number;
  fetching?: boolean;
  onPageChange: (page: number) => void;
}

function sessionsErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "NOT_JOINED" || error.status === 403) {
      return "Join the challenge to view entrant sessions.";
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Failed to load sessions.";
}

export default function ChallengeDetailSessionsV2({
  signedIn,
  loading,
  data,
  error,
  page,
  pageSize,
  fetching = false,
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
      </div>
      {!signedIn ? (
        <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
          Sign in to browse entrants&apos; sessions.
        </p>
      ) : loading ? (
        <p className="py-4 font-v2-body text-sm text-v2-on-surface-variant">
          Loading…
        </p>
      ) : error ? (
        <p className="py-4 font-v2-body text-sm text-v2-error">
          {sessionsErrorMessage(error)}
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
          <V2ListPaginationFooter
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
