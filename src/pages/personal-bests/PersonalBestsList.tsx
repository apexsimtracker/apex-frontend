import { Link, useNavigate } from "react-router-dom";
import type { PersonalBestRow } from "@/lib/api";
import { formatCarName, formatLapMs, cn } from "@/lib/utils";
import { formatTrackName } from "@/lib/tracks";

const HEADER_CELL =
  "py-2 text-[10px] font-bold uppercase tracking-wider text-apex-on-surface-variant";

type PersonalBestsListProps = {
  rows: PersonalBestRow[];
};

function formatUpdatedDate(updatedAt: string): string {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return updatedAt;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function LapTimeDisplay({
  bestLapMs,
  sessionId,
  className,
}: {
  bestLapMs: number;
  sessionId: string | null;
  className?: string;
}) {
  const formatted = formatLapMs(bestLapMs);

  if (sessionId) {
    return (
      <Link
        to={`/sessions/${sessionId}`}
        className={cn(
          "font-apex-headline font-bold tabular-nums text-apex-primary transition-colors hover:text-apex-primary/80",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {formatted}
      </Link>
    );
  }

  return (
    <span
      className={cn(
        "font-apex-headline font-bold tabular-nums text-apex-on-surface",
        className,
      )}
    >
      {formatted}
    </span>
  );
}

export default function PersonalBestsList({
  rows,
}: PersonalBestsListProps) {
  const navigate = useNavigate();

  return (
    <section className="space-y-3">
      <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface">
        Your records
      </h2>

      <div className="hidden overflow-hidden rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-low lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-apex-outline-variant/15">
                <th className={`${HEADER_CELL} px-4`}>Track</th>
                <th className={`${HEADER_CELL} px-4`}>Car</th>
                <th className={`${HEADER_CELL} px-4 text-right`}>Best lap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apex-outline-variant/5">
              {rows.map((pb) => {
                const trackLabel = pb.trackName ?? formatTrackName(pb.track);
                const handleOpenSession = () => {
                  if (pb.sessionId) {
                    navigate(`/sessions/${pb.sessionId}`);
                  }
                };

                return (
                  <tr
                    key={pb.id}
                    onClick={handleOpenSession}
                    className={cn(
                      "transition-colors",
                      pb.sessionId &&
                        "cursor-pointer hover:bg-apex-surface-container-high/50",
                    )}
                  >
                    <td className="whitespace-nowrap p-4 align-middle">
                      <div className="flex flex-col justify-center">
                        <span className="font-apex-body text-xs font-bold text-apex-on-surface">
                          {trackLabel}
                        </span>
                        <span className="font-apex-body text-[9px] text-apex-on-surface-variant">
                          {formatUpdatedDate(pb.updatedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-4 align-middle">
                      <span className="font-apex-body text-xs font-medium text-apex-on-surface">
                        {formatCarName(pb.car)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-4 text-right align-middle">
                      <LapTimeDisplay
                        bestLapMs={pb.bestLapMs}
                        sessionId={pb.sessionId}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {rows.map((pb) => {
          const trackLabel = pb.trackName ?? formatTrackName(pb.track);
          const handleOpenSession = () => {
            if (pb.sessionId) {
              navigate(`/sessions/${pb.sessionId}`);
            }
          };

          return (
            <div
              key={pb.id}
              onClick={handleOpenSession}
              className={cn(
                "rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-low p-4 transition-colors",
                pb.sessionId && "cursor-pointer hover:bg-apex-surface-container",
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-apex-body text-xs font-bold text-apex-on-surface">
                    {trackLabel}
                  </p>
                  <p className="font-apex-body text-[9px] text-apex-on-surface-variant">
                    {formatUpdatedDate(pb.updatedAt)}
                  </p>
                </div>
                <LapTimeDisplay
                  bestLapMs={pb.bestLapMs}
                  sessionId={pb.sessionId}
                  className="text-sm"
                />
              </div>
              <div>
                <p className="font-apex-body text-[10px] uppercase text-apex-on-surface-variant">
                  Car
                </p>
                <p className="font-apex-body text-xs font-medium text-apex-on-surface">
                  {formatCarName(pb.car)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
