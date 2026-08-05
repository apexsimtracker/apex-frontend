import { Link } from "react-router-dom";
import { PenLine, Upload } from "lucide-react";
import {
  formatChallengeDateTime,
  formatChallengeTimeRemaining,
} from "@/lib/datetime";
import {
  formatCarName,
  formatLapDelta,
  formatLapMs,
  formatTrackName,
} from "@/lib/utils";
import { formatSimEnum } from "@/lib/enumFormat";
import type { ChallengeDetail } from "@/lib/api/challenges";
import { useChallengeLiveTimeSec } from "@/pages/challenges/ChallengeLiveTime";

interface ChallengeDetailOverviewProps {
  challenge: ChallengeDetail;
  challengeId: string;
  status: "Live" | "Upcoming" | "Finished";
  upcomingScheduleText: string | null;
}

export default function ChallengeDetailOverview({
  challenge,
  challengeId,
  status,
  upcomingScheduleText,
}: ChallengeDetailOverviewProps) {
  const liveTimeRemainingSec = useChallengeLiveTimeSec();
  const activeTimeRemainingSec =
    challenge.status === "ACTIVE" ? liveTimeRemainingSec : null;
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <div className="rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container p-6">
          <h2 className="mb-6 font-apex-headline text-lg font-semibold text-apex-on-surface">
            Challenge details
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-2 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                Sim
              </p>
              <p className="font-apex-body text-sm text-apex-on-surface">
                {formatSimEnum(challenge.sim)}
              </p>
            </div>
            <div>
              <p className="mb-2 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                Track
              </p>
              <p className="font-apex-body text-sm text-apex-on-surface">
                {formatTrackName(challenge.track)}
              </p>
            </div>
            <div>
              <p className="mb-2 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                Car class
              </p>
              <p className="font-apex-body text-sm text-apex-on-surface">
                {formatCarName(challenge.carClass ?? challenge.vehicle)}
              </p>
            </div>
            <div>
              <p className="mb-2 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                Drivers
              </p>
              <p className="font-apex-body text-sm text-apex-on-surface">
                {challenge.participants}
              </p>
            </div>
            <div>
              <p className="mb-2 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                Starts
              </p>
              <p className="font-apex-body text-sm text-apex-on-surface">
                {formatChallengeDateTime(challenge.startsAt)}
              </p>
            </div>
            <div>
              <p className="mb-2 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                Ends
              </p>
              <p className="font-apex-body text-sm text-apex-on-surface">
                {formatChallengeDateTime(challenge.endsAt)}
              </p>
            </div>
          </div>

          {challenge.joined && challenge.status === "ACTIVE" && (
            <div className="mt-6 space-y-4 border-t border-apex-outline-variant/15 pt-6">
              <div>
                <p className="font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                  Record a lap
                </p>
                <p className="mt-1 font-apex-body text-sm text-apex-on-surface-variant">
                  Post a lap to update your position on the leaderboard.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  to={`/manual?challenge=${encodeURIComponent(challengeId)}`}
                  state={{
                    challengePrefill: {
                      sim: challenge.sim,
                      track: challenge.track,
                      car: challenge.carClass ?? challenge.vehicle,
                    },
                  }}
                  className="flex flex-col gap-3 rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-high p-4 transition-colors hover:border-white/40 hover:bg-apex-surface-container"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-apex-sm border border-apex-outline-variant/15 bg-apex-surface-container text-apex-on-surface-variant">
                    <PenLine className="size-4" aria-hidden />
                  </span>
                  <span className="font-apex-headline text-sm font-bold text-apex-on-surface">
                    Log manual lap
                  </span>
                  <span className="font-apex-body text-xs leading-relaxed text-apex-on-surface-variant">
                    Enter your lap time by hand
                  </span>
                </Link>
                <Link
                  to={`/upload?challenge=${encodeURIComponent(challengeId)}`}
                  className="flex flex-col gap-3 rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-high p-4 transition-colors hover:border-white/40 hover:bg-apex-surface-container"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-apex-sm border border-apex-outline-variant/15 bg-apex-surface-container text-apex-on-surface-variant">
                    <Upload className="size-4" aria-hidden />
                  </span>
                  <span className="font-apex-headline text-sm font-bold text-apex-on-surface">
                    Upload .ibt
                  </span>
                  <span className="font-apex-body text-xs leading-relaxed text-apex-on-surface-variant">
                    Verified telemetry from your sim
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="sticky top-20 rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container p-6">
          <h2 className="mb-6 font-apex-headline text-lg font-semibold text-apex-on-surface">
            Your performance
          </h2>
          <div className="space-y-4">
            {challenge.yourPosition != null ? (
              <div className="rounded-xl bg-apex-surface-container-high p-4">
                <p className="mb-2 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                  Position
                </p>
                <p className="font-apex-headline text-3xl font-extrabold tabular-nums text-apex-primary">
                  #{challenge.yourPosition}
                </p>
                <p className="mt-2 font-apex-body text-xs text-apex-on-surface-variant">
                  of {challenge.participants} drivers
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-apex-surface-container-high p-4">
                <p className="mb-2 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                  Status
                </p>
                <p className="font-apex-body text-sm text-apex-on-surface">
                  {status}
                </p>
                {activeTimeRemainingSec != null && (
                  <p className="mt-2 font-apex-body text-xs text-apex-on-surface-variant">
                    {formatChallengeTimeRemaining(activeTimeRemainingSec)}{" "}
                    remaining
                  </p>
                )}
                {activeTimeRemainingSec == null && upcomingScheduleText && (
                  <p className="mt-2 font-apex-body text-xs text-apex-on-surface-variant">
                    {upcomingScheduleText}
                  </p>
                )}
              </div>
            )}

            {challenge.yourBestLapMs != null && (
              <div className="rounded-xl bg-apex-surface-container-high p-4">
                <p className="mb-2 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                  Your best
                </p>
                <p className="font-apex-headline text-2xl font-bold text-apex-on-surface">
                  {formatLapMs(challenge.yourBestLapMs)}
                </p>
                {challenge.fastestLapMs != null &&
                  challenge.yourBestLapMs - challenge.fastestLapMs > 0 && (
                    <p className="mt-1 font-apex-body text-xs text-apex-on-surface-variant">
                      +{" "}
                      {formatLapDelta(
                        challenge.yourBestLapMs - challenge.fastestLapMs,
                      )}
                    </p>
                  )}
              </div>
            )}

            <div className="rounded-xl bg-apex-surface-container-high p-4">
              <p className="mb-2 font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                Fastest
              </p>
              <p className="font-apex-headline text-2xl font-bold text-apex-on-surface">
                {challenge.fastestLapMs != null
                  ? formatLapMs(challenge.fastestLapMs)
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
