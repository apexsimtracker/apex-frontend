import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  v2ManualTextareaClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";
import { DISCUSSION_REPLY_NEAR_LIMIT } from "@/pages/v2/discussion/discussionReplyUtils";

export type DiscussionReplyComposeV2Props = {
  replyBody: string;
  replyError: string | null;
  posting: boolean;
  onReplyBodyChange: (value: string) => void;
  onPostReply: () => void;
};

export default function DiscussionReplyComposeV2({
  replyBody,
  replyError,
  posting,
  onReplyBodyChange,
  onPostReply,
}: DiscussionReplyComposeV2Props) {
  const nearLimit = replyBody.length >= DISCUSSION_REPLY_NEAR_LIMIT;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <MessageCircle
          className="size-3.5 shrink-0 text-v2-primary"
          strokeWidth={1.75}
          aria-hidden
        />
        <h3 className="font-v2-headline text-[10px] uppercase tracking-[0.2em] text-v2-on-surface-variant">
          Add a reply
        </h3>
      </div>

      {replyError && (
        <p className="font-v2-body text-xs text-v2-error">{replyError}</p>
      )}

      <div className="flex items-end gap-2.5">
        <Textarea
          className={cn(
            v2ManualTextareaClassName,
            "min-h-[2.75rem] max-h-24 flex-1 resize-none px-3 py-2 text-sm",
          )}
          rows={2}
          placeholder="Write a reply…"
          value={replyBody}
          onChange={(e) => onReplyBodyChange(e.target.value)}
          disabled={posting}
        />
        <Button
          type="button"
          onClick={onPostReply}
          disabled={!replyBody.trim() || posting}
          className={cn("h-9 shrink-0 px-5 text-xs", v2PrimaryButtonClassName)}
        >
          {posting ? "Posting…" : "Post"}
        </Button>
      </div>

      {nearLimit && (
        <p className="font-v2-body text-[10px] text-v2-on-surface-variant">
          {replyBody.length}/2000
        </p>
      )}
    </div>
  );
}
