import { CheckCircle } from "lucide-react";
import {
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { resolveChallengeCoverUrl } from "@/lib/challenges/coverImage";
import { formatChallengeTimeRemaining } from "@/lib/datetime";
import { formatSimEnum } from "@/lib/enumFormat";
import type { ChallengeApiStatus, ChallengeDetail } from "@/lib/api/challenges";
import { cn, formatCarName, formatLapMs, formatTrackName } from "@/lib/utils";
import { useChallengeLiveTimeSec } from "@/pages/challenges/ChallengeLiveTime";

export function challengeStatusLabel(
  status: ChallengeApiStatus,
): "Live" | "Upcoming" | "Finished" {
  switch (status) {
    case "ACTIVE":
      return "Live";
    case "UPCOMING":
      return "Upcoming";
    case "ENDED":
      return "Finished";
    default:
      return "Finished";
  }
}

function statusBadgeClass(status: "Live" | "Upcoming" | "Finished"): string {
  switch (status) {
    case "Live":
      return "bg-apex-primary text-white";
    case "Upcoming":
      return "border border-blue-500/30 bg-blue-500/15 text-blue-200";
    case "Finished":
      return "border border-apex-outline-variant/30 bg-apex-surface-container-high text-apex-on-surface-variant";
  }
}

interface ChallengeDetailHeroProps {
  challenge: ChallengeDetail;
  status: "Live" | "Upcoming" | "Finished";
  isLoggedIn: boolean;
  canJoin: boolean;
  canLeave: boolean;
  showLeaveLockedHint: boolean;
  joinPending: boolean;
  leavePending: boolean;
  joinBanMessage: string | null;
  leaveError: string | null;
  confirmingLeave: boolean;
  onJoin: () => void;
  onConfirmLeave: () => void;
  onCancelLeave: () => void;
  onStartLeave: () => void;
}

export default function ChallengeDetailHero({
  challenge,
  status,
  isLoggedIn,
  canJoin,
  canLeave,
  showLeaveLockedHint,
  joinPending,
  leavePending,
  joinBanMessage,
  leaveError,
  confirmingLeave,
  onJoin,
  onConfirmLeave,
  onCancelLeave,
  onStartLeave,
}: ChallengeDetailHeroProps) {
  const liveTimeRemainingSec = useChallengeLiveTimeSec();
  const countdownMs =
    liveTimeRemainingSec != null ? liveTimeRemainingSec * 1000 : null;

  const thirdStatLabel =
    challenge.targetTimeMs != null ? "Target time" : "Drivers";
  const thirdStatValue =
    challenge.targetTimeMs != null
      ? formatLapMs(challenge.targetTimeMs)
      : String(challenge.participants);

  const showJoinedPanel = isLoggedIn && !canJoin && challenge.joined;
  // Signed-out (and finished) views render no action below the stats, so the
  // grid's bottom margin would stack on the container padding and leave a large
  // dead gap. Desktop spacing is unchanged.
  const hasHeroActions = canJoin || showJoinedPanel;

  return (
    <section className="overflow-hidden rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container">
      <div className="relative h-48 overflow-hidden sm:h-64">
        <img
          src={resolveChallengeCoverUrl(challenge.coverImageUrl)}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-apex-background via-transparent to-black/20" />
        <div
          className={cn(
            "absolute left-4 top-4 flex items-center gap-1 rounded-apex-sm px-2 py-0.5 font-apex-body text-[10px] font-black uppercase",
            statusBadgeClass(status),
          )}
        >
          {status === "Live" && (
            <span className="size-1 animate-pulse rounded-full bg-white" />
          )}
          {status}
        </div>
        {countdownMs != null &&
          challenge.status !== "ENDED" &&
          countdownMs > 0 && (
            <div className="absolute right-4 top-4 font-apex-body text-[11px] font-medium text-apex-on-surface drop-shadow-md">
              {challenge.status === "UPCOMING" ? "Starts in " : "Ends in "}
              <span className="font-bold">
                {formatChallengeTimeRemaining(Math.floor(countdownMs / 1000))}
              </span>
            </div>
          )}
        <div className="absolute inset-x-6 bottom-6">
          <h1 className="font-apex-headline text-2xl font-bold tracking-tight text-apex-on-surface sm:text-3xl">
            {challenge.title}
          </h1>
          {challenge.description && (
            <p className="mt-1 line-clamp-2 font-apex-body text-sm text-apex-on-surface-variant">
              {challenge.description}
            </p>
          )}
        </div>
      </div>

      <div className={cn("p-6", !hasHeroActions && "pb-4 lg:pb-6")}>
        {/* On mobile, Sim + the third stat share the first row while the
            (potentially long) Track/Vehicle name gets its own full-width row.
            At sm+ this reverts to the standard 3-up grid. */}
        <div
          className={cn(
            "grid grid-cols-2 gap-4 sm:grid-cols-3",
            hasHeroActions ? "mb-6" : "mb-0 lg:mb-6",
          )}
        >
          <div className="order-1 min-w-0">
            <p className="mb-1 font-apex-body text-[10px] font-semibold uppercase tracking-wide text-apex-on-surface-variant">
              Sim
            </p>
            <p className="font-apex-body text-sm font-bold text-apex-on-surface">
              {formatSimEnum(challenge.sim)}
            </p>
          </div>
          <div className="order-3 col-span-2 min-w-0 sm:order-2 sm:col-span-1">
            <p className="mb-1 font-apex-body text-[10px] font-semibold uppercase tracking-wide text-apex-on-surface-variant">
              {challenge.targetTimeMs != null ? "Track" : "Vehicle"}
            </p>
            <p className="font-apex-body text-sm font-bold text-apex-on-surface">
              {challenge.targetTimeMs != null
                ? formatTrackName(challenge.track)
                : formatCarName(challenge.carClass ?? challenge.vehicle)}
            </p>
          </div>
          <div className="order-2 min-w-0 sm:order-3">
            <p className="mb-1 font-apex-body text-[10px] font-semibold uppercase tracking-wide text-apex-on-surface-variant">
              {thirdStatLabel}
            </p>
            <p className="font-apex-body text-sm font-bold text-apex-on-surface">
              {thirdStatValue}
            </p>
          </div>
        </div>

        {canJoin && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={joinPending}
              onClick={onJoin}
              className={cn(
                appPrimaryButtonClassName,
                "flex w-full items-center justify-center gap-2 py-3.5 normal-case tracking-normal active:scale-[0.98]",
                joinPending && "cursor-not-allowed opacity-60",
              )}
            >
              {joinPending ? "Joining…" : "Join challenge"}
            </button>
            {joinBanMessage && (
              <div
                role="alert"
                className="rounded-apex-lg border border-apex-error/30 bg-apex-error/10 px-4 py-2 font-apex-body text-xs text-apex-error"
              >
                {joinBanMessage}
              </div>
            )}
          </div>
        )}

        {showJoinedPanel && (
          <div className="flex flex-col gap-2">
            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-apex-outline-variant/20 bg-apex-surface-container-high py-3.5 font-apex-body text-sm font-bold uppercase tracking-wider text-apex-on-surface">
              <CheckCircle className="size-5 text-apex-primary" aria-hidden />
              Joined
            </div>
            {canLeave && !confirmingLeave && (
              <button
                type="button"
                disabled={leavePending}
                onClick={onStartLeave}
                className={cn(
                  appOutlineButtonClassName,
                  "w-full py-2.5 font-apex-body text-sm font-medium normal-case tracking-normal text-apex-on-surface-variant hover:text-apex-on-surface",
                )}
              >
                Leave challenge
              </button>
            )}
            {canLeave && confirmingLeave && (
              <div className="flex flex-col gap-2">
                <p className="text-center font-apex-body text-xs text-apex-on-surface-variant">
                  Leave this challenge?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={leavePending}
                    onClick={onConfirmLeave}
                    className="flex-1 rounded-apex-sm bg-apex-error py-2.5 font-apex-body text-sm font-bold text-white transition-colors hover:bg-apex-error/90 disabled:opacity-60"
                  >
                    {leavePending ? "Leaving…" : "Confirm leave"}
                  </button>
                  <button
                    type="button"
                    disabled={leavePending}
                    onClick={onCancelLeave}
                    className={cn(
                      appOutlineButtonClassName,
                      "flex-1 py-2.5 font-apex-body text-sm font-medium normal-case tracking-normal text-apex-on-surface-variant",
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {showLeaveLockedHint && (
              <p className="text-center font-apex-body text-xs text-apex-on-surface-variant">
                You can&apos;t leave after posting a session.
              </p>
            )}
            {leaveError && (
              <div
                role="alert"
                className="rounded-apex-lg border border-apex-error/30 bg-apex-error/10 px-4 py-2 font-apex-body text-xs text-apex-error"
              >
                {leaveError}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
