import { Link, useNavigate } from "react-router-dom";
import type { PersonalBestRow } from "@/lib/api";
import { formatCarName, formatLapMs, cn } from "@/lib/utils";
import { formatTrackName } from "@/lib/tracks";

const HEADER_CELL =
  "py-2 text-[10px] font-bold uppercase tracking-wider text-v2-on-surface-variant";

type PersonalBestsListV2Props = {
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
        to={`/v2/sessions/${sessionId}`}
        className={cn(
          "font-v2-headline font-bold tabular-nums text-v2-primary transition-colors hover:text-v2-primary/80",
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
        "font-v2-headline font-bold tabular-nums text-v2-on-surface",
        className,
      )}
    >
      {formatted}
    </span>
  );
}

export default function PersonalBestsListV2({
  rows,
}: PersonalBestsListV2Props) {
  const navigate = useNavigate();

  return (
    <section className="space-y-3">
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        Your records
      </h2>

      <div className="hidden overflow-hidden rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-v2-outline-variant/15">
                <th className={`${HEADER_CELL} px-4`}>Track</th>
                <th className={`${HEADER_CELL} px-4`}>Car</th>
                <th className={`${HEADER_CELL} px-4 text-right`}>Best lap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-v2-outline-variant/5">
              {rows.map((pb) => {
                const trackLabel = pb.trackName ?? formatTrackName(pb.track);
                const handleOpenSession = () => {
                  if (pb.sessionId) {
                    navigate(`/v2/sessions/${pb.sessionId}`);
                  }
                };

                return (
                  <tr
                    key={pb.id}
                    onClick={handleOpenSession}
                    className={cn(
                      "transition-colors",
                      pb.sessionId &&
                        "cursor-pointer hover:bg-v2-surface-container-high/50",
                    )}
                  >
                    <td className="whitespace-nowrap p-4 align-middle">
                      <div className="flex flex-col justify-center">
                        <span className="font-v2-body text-xs font-bold text-v2-on-surface">
                          {trackLabel}
                        </span>
                        <span className="font-v2-body text-[9px] text-v2-on-surface-variant">
                          {formatUpdatedDate(pb.updatedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-4 align-middle">
                      <span className="font-v2-body text-xs font-medium text-v2-on-surface">
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
              navigate(`/v2/sessions/${pb.sessionId}`);
            }
          };

          return (
            <div
              key={pb.id}
              onClick={handleOpenSession}
              className={cn(
                "rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-4 transition-colors",
                pb.sessionId && "cursor-pointer hover:bg-v2-surface-container",
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-v2-body text-xs font-bold text-v2-on-surface">
                    {trackLabel}
                  </p>
                  <p className="font-v2-body text-[9px] text-v2-on-surface-variant">
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
                <p className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
                  Car
                </p>
                <p className="font-v2-body text-xs font-medium text-v2-on-surface">
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
