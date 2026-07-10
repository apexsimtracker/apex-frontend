import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  v2ManualTextareaClassName,
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { V2BaseModal } from "@/components/v2/ui/V2BaseModal";
import { DISCUSSION_REPLY_NEAR_LIMIT } from "@/pages/v2/discussion/discussionReplyUtils";

type DiscussionReplyModalV2Props = {
  open: boolean;
  onClose: () => void;
  replyBody: string;
  replyError: string | null;
  posting: boolean;
  onReplyBodyChange: (value: string) => void;
  onPostReply: () => void;
};

export default function DiscussionReplyModalV2({
  open,
  onClose,
  replyBody,
  replyError,
  posting,
  onReplyBodyChange,
  onPostReply,
}: DiscussionReplyModalV2Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const closeModal = () => {
    if (posting) return;
    onClose();
  };

  const nearLimit = replyBody.length >= DISCUSSION_REPLY_NEAR_LIMIT;

  if (!open) return null;

  return (
    <V2BaseModal
      isOpen={open}
      onClose={closeModal}
      title="Add a reply"
      size="md"
      mobileVariant="fullscreen"
      footer={
        <>
          <button
            type="button"
            className={cn(
              v2OutlineButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            onClick={closeModal}
            disabled={posting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(
              v2PrimaryButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            onClick={onPostReply}
            disabled={!replyBody.trim() || posting}
          >
            {posting ? "Posting…" : "Post reply"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {replyError && (
          <p className="font-v2-body text-sm text-v2-error">{replyError}</p>
        )}
        <textarea
          ref={textareaRef}
          className={cn(v2ManualTextareaClassName, "min-h-[160px] resize-y")}
          rows={4}
          placeholder="Write a reply…"
          value={replyBody}
          onChange={(e) => onReplyBodyChange(e.target.value)}
          disabled={posting}
        />
        {nearLimit && (
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            Approaching 2,000 character limit ({replyBody.length}
            /2000)
          </p>
        )}
      </div>
    </V2BaseModal>
  );
}
