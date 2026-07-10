import { CheckCircle } from "lucide-react";
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { resolveChallengeCoverUrl } from "@/lib/challenges/coverImage";
import { formatChallengeTimeRemaining } from "@/lib/datetime";
import { formatSimEnum } from "@/lib/enumFormat";
import type { ChallengeApiStatus, ChallengeDetail } from "@/lib/api";
import { cn, formatCarName, formatLapMs, formatTrackName } from "@/lib/utils";

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
      return "bg-v2-primary text-white";
    case "Upcoming":
      return "border border-blue-500/30 bg-blue-500/15 text-blue-200";
    case "Finished":
      return "border border-v2-outline-variant/30 bg-v2-surface-container-high text-v2-on-surface-variant";
  }
}

interface ChallengeDetailHeroV2Props {
  challenge: ChallengeDetail;
  status: "Live" | "Upcoming" | "Finished";
  countdownMs: number | null;
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

export default function ChallengeDetailHeroV2({
  challenge,
  status,
  countdownMs,
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
}: ChallengeDetailHeroV2Props) {
  const thirdStatLabel =
    challenge.targetTimeMs != null ? "Target time" : "Drivers";
  const thirdStatValue =
    challenge.targetTimeMs != null
      ? formatLapMs(challenge.targetTimeMs)
      : String(challenge.participants);

  return (
    <section className="overflow-hidden rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container">
      <div className="relative h-48 overflow-hidden sm:h-64">
        <img
          src={resolveChallengeCoverUrl(challenge.coverImageUrl)}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-v2-background via-transparent to-black/20" />
        <div
          className={cn(
            "absolute left-4 top-4 flex items-center gap-1 rounded-v2-sm px-2 py-0.5 font-v2-body text-[10px] font-black uppercase",
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
            <div className="absolute right-4 top-4 font-v2-body text-[11px] font-medium text-v2-on-surface drop-shadow-md">
              {challenge.status === "UPCOMING" ? "Starts in " : "Ends in "}
              <span className="font-bold">
                {formatChallengeTimeRemaining(Math.floor(countdownMs / 1000))}
              </span>
            </div>
          )}
        <div className="absolute inset-x-6 bottom-6">
          <h1 className="font-v2-headline text-2xl font-bold tracking-tight text-v2-on-surface sm:text-3xl">
            {challenge.title}
          </h1>
          {challenge.description && (
            <p className="mt-1 line-clamp-2 font-v2-body text-sm text-v2-on-surface-variant">
              {challenge.description}
            </p>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div>
            <p className="mb-1 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
              Sim
            </p>
            <p className="font-v2-body text-sm font-bold text-v2-on-surface">
              {formatSimEnum(challenge.sim)}
            </p>
          </div>
          <div>
            <p className="mb-1 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
              {challenge.targetTimeMs != null ? "Track" : "Vehicle"}
            </p>
            <p className="font-v2-body text-sm font-bold text-v2-on-surface">
              {challenge.targetTimeMs != null
                ? formatTrackName(challenge.track)
                : formatCarName(challenge.carClass ?? challenge.vehicle)}
            </p>
          </div>
          <div>
            <p className="mb-1 font-v2-body text-[10px] font-semibold uppercase tracking-wide text-v2-on-surface-variant">
              {thirdStatLabel}
            </p>
            <p className="font-v2-body text-sm font-bold text-v2-on-surface">
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
                v2PrimaryButtonClassName,
                "flex w-full items-center justify-center gap-2 py-3.5 normal-case tracking-normal active:scale-[0.98]",
                joinPending && "cursor-not-allowed opacity-60",
              )}
            >
              {joinPending ? "Joining…" : "Join challenge"}
            </button>
            {joinBanMessage && (
              <div
                role="alert"
                className="rounded-v2-lg border border-v2-error/30 bg-v2-error/10 px-4 py-2 font-v2-body text-xs text-v2-error"
              >
                {joinBanMessage}
              </div>
            )}
          </div>
        )}

        {!canJoin && challenge.joined && (
          <div className="flex flex-col gap-2">
            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-v2-outline-variant/20 bg-v2-surface-container-high py-3.5 font-v2-body text-sm font-bold uppercase tracking-wider text-v2-on-surface">
              <CheckCircle className="size-5 text-v2-primary" aria-hidden />
              Joined
            </div>
            {canLeave && !confirmingLeave && (
              <button
                type="button"
                disabled={leavePending}
                onClick={onStartLeave}
                className={cn(
                  v2OutlineButtonClassName,
                  "w-full py-2.5 font-v2-body text-sm font-medium normal-case tracking-normal text-v2-on-surface-variant hover:text-v2-on-surface",
                )}
              >
                Leave challenge
              </button>
            )}
            {canLeave && confirmingLeave && (
              <div className="flex flex-col gap-2">
                <p className="text-center font-v2-body text-xs text-v2-on-surface-variant">
                  Leave this challenge?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={leavePending}
                    onClick={onConfirmLeave}
                    className="flex-1 rounded-v2-sm bg-v2-error py-2.5 font-v2-body text-sm font-bold text-white transition-colors hover:bg-v2-error/90 disabled:opacity-60"
                  >
                    {leavePending ? "Leaving…" : "Confirm leave"}
                  </button>
                  <button
                    type="button"
                    disabled={leavePending}
                    onClick={onCancelLeave}
                    className={cn(
                      v2OutlineButtonClassName,
                      "flex-1 py-2.5 font-v2-body text-sm font-medium normal-case tracking-normal text-v2-on-surface-variant",
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {showLeaveLockedHint && (
              <p className="text-center font-v2-body text-xs text-v2-on-surface-variant">
                You can&apos;t leave after posting a session.
              </p>
            )}
            {leaveError && (
              <div
                role="alert"
                className="rounded-v2-lg border border-v2-error/30 bg-v2-error/10 px-4 py-2 font-v2-body text-xs text-v2-error"
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
