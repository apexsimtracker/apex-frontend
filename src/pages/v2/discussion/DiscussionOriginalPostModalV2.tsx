import { cn } from "@/lib/utils";
import { v2OutlineButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { V2BaseModal } from "@/components/v2/ui/V2BaseModal";
import type { Discussion } from "@/lib/api";

type DiscussionOriginalPostModalV2Props = {
  open: boolean;
  discussion: Discussion;
  onClose: () => void;
};

export default function DiscussionOriginalPostModalV2({
  open,
  discussion,
  onClose,
}: DiscussionOriginalPostModalV2Props) {
  if (!open) return null;

  return (
    <V2BaseModal
      isOpen={open}
      onClose={onClose}
      title="Original post"
      size="md"
      footer={
        <button
          type="button"
          className={cn(
            v2OutlineButtonClassName,
            "inline-flex items-center justify-center px-4 py-2",
          )}
          onClick={onClose}
        >
          Close
        </button>
      }
      bodyClassName="min-h-0 space-y-3 font-v2-body text-sm"
    >
      <p className="font-semibold text-v2-on-surface">
        {discussion.originalTitle ?? discussion.title}
      </p>
      <p className="whitespace-pre-wrap text-v2-on-surface-variant">
        {discussion.originalBody ??
          discussion.content ??
          discussion.description ??
          ""}
      </p>
    </V2BaseModal>
  );
}
