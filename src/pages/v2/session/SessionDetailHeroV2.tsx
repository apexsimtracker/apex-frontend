import { useState } from "react";
import { Share2, Pencil, Trash2, Repeat } from "lucide-react";
import { formatTrackName } from "@/lib/tracks";

type SessionDetailHeroV2Props = {
  trackName: string | null;
  trackImageUrl?: string | null;
  canEditSession: boolean;
  canManualExtras: boolean;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLogAgain: () => void;
};

export default function SessionDetailHeroV2({
  trackName,
  trackImageUrl,
  canEditSession,
  canManualExtras,
  onShare,
  onEdit,
  onDelete,
  onLogAgain,
}: SessionDetailHeroV2Props) {
  const title = formatTrackName(trackName) || "Unknown track";
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(trackImageUrl?.trim()) && !imageFailed;

  return (
    <header className="relative min-h-[220px] w-full overflow-hidden rounded-xl bg-v2-surface-container-low sm:min-h-[256px]">
      {showImage ? (
        <img
          alt=""
          className="absolute inset-0 size-full object-cover opacity-90"
          src={trackImageUrl!}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-v2-surface-container-highest via-v2-surface-container to-v2-background"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--v2-primary)/0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--v2-primary)/0.08),transparent_50%)]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-v2-background via-v2-background/50 to-transparent" />

      <div className="relative z-10 flex items-center justify-end gap-2 px-4 pt-4 sm:px-6 sm:pt-6">
        {canManualExtras && (
          <>
            <button
              type="button"
              onClick={onLogAgain}
              className="flex items-center justify-center rounded-full p-2 text-v2-on-surface transition-colors hover:bg-v2-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/50 active:scale-95"
              aria-label="Log again"
            >
              <Repeat className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center justify-center rounded-full p-2 text-v2-error transition-colors hover:bg-v2-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/50 active:scale-95"
              aria-label="Delete session"
            >
              <Trash2 className="size-5" aria-hidden />
            </button>
          </>
        )}
        {canEditSession && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center justify-center rounded-full p-2 text-v2-on-surface transition-colors hover:bg-v2-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/50 active:scale-95"
            aria-label="Edit session"
          >
            <Pencil className="size-5" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={onShare}
          className="flex items-center justify-center rounded-full p-2 text-v2-on-surface transition-colors hover:bg-v2-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/50 active:scale-95"
          aria-label="Share session"
        >
          <Share2 className="size-5" aria-hidden />
        </button>
      </div>

      <div className="absolute bottom-6 left-4 z-10 sm:left-6">
        <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface sm:text-4xl">
          {title}
        </h1>
      </div>
    </header>
  );
}
