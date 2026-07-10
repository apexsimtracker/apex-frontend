import { PenLine, Pencil, Repeat, Share2, Trash2 } from "lucide-react";
import SimBadge from "@/components/SimBadge";
import SessionTypeTag from "@/components/SessionTypeTag";
import {
  v2OutlineButtonClassName,
  v2SecondaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";
import { formatTrackName } from "@/lib/tracks";
import type { SessionDetail } from "@/features/session-detail/sessionDetailData";

type ResolvedSessionFields = {
  track: string | null;
  car: string | null;
  carRawForFormat: string | null;
  sim: string | null;
};

type SessionDetailHeaderV2Props = {
  session: SessionDetail;
  resolved: ResolvedSessionFields;
  isManual: boolean;
  canEditSession: boolean;
  canManualExtras: boolean;
  totalLapsCount: number;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLogAgain: () => void;
};

export default function SessionDetailHeaderV2({
  session,
  resolved,
  isManual,
  canEditSession,
  canManualExtras,
  totalLapsCount,
  onShare,
  onEdit,
  onDelete,
  onLogAgain,
}: SessionDetailHeaderV2Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <SessionTypeTag
            sessionType={session.sessionType}
            manualSessionKind={session.manualSessionKind}
            size="md"
          />
          <SimBadge sim={resolved.sim ?? session.sim} />
          {isManual && (
            <span className="inline-flex items-center gap-1 rounded-v2-sm border border-v2-outline-variant/20 bg-v2-surface-container-high px-1.5 py-0.5 font-v2-body text-[10px] font-medium tracking-wide text-v2-on-surface-variant">
              <PenLine className="size-3" aria-hidden />
              Manual
            </span>
          )}
        </div>
        <h1 className="mt-2 font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
          {formatTrackName(resolved.track)}
        </h1>
        {totalLapsCount > 0 && (
          <p className="mt-2 font-v2-body text-sm text-v2-on-surface-variant">
            {totalLapsCount} lap{totalLapsCount === 1 ? "" : "s"}
          </p>
        )}
        {import.meta.env.DEV && session.processingDurationMs != null && (
          <p className="mt-1 font-v2-body text-xs text-v2-on-surface-variant/70">
            Ingestion: {(session.processingDurationMs / 1000).toFixed(1)}s
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {canManualExtras && (
          <>
            <button
              type="button"
              onClick={onLogAgain}
              className={cn(
                v2OutlineButtonClassName,
                "inline-flex items-center gap-2 px-3 py-2 font-v2-body text-sm font-medium normal-case tracking-normal",
              )}
            >
              <Repeat className="size-4" aria-hidden />
              Log Again
            </button>
            <button
              type="button"
              onClick={onDelete}
              className={cn(
                v2OutlineButtonClassName,
                "inline-flex items-center gap-2 border-v2-error/30 px-3 py-2 font-v2-body text-sm font-medium normal-case tracking-normal text-v2-error hover:bg-v2-error/10",
              )}
            >
              <Trash2 className="size-4" aria-hidden />
              Delete
            </button>
          </>
        )}
        {canEditSession && (
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              v2OutlineButtonClassName,
              "inline-flex items-center gap-2 px-3 py-2 font-v2-body text-sm font-medium normal-case tracking-normal",
            )}
          >
            <Pencil className="size-4" aria-hidden />
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={onShare}
          className={cn(
            v2SecondaryButtonClassName,
            "inline-flex items-center gap-2 px-4 py-2 font-v2-body text-sm font-medium normal-case tracking-normal",
          )}
        >
          Share
          <Share2 className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
