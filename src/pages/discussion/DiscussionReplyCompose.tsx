import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  appManualTextareaClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";
import { DISCUSSION_REPLY_NEAR_LIMIT } from "@/pages/discussion/discussionReplyUtils";

export type DiscussionReplyComposeProps = {
  replyBody: string;
  replyError: string | null;
  posting: boolean;
  onReplyBodyChange: (value: string) => void;
  onPostReply: () => void;
};

export default function DiscussionReplyCompose({
  replyBody,
  replyError,
  posting,
  onReplyBodyChange,
  onPostReply,
}: DiscussionReplyComposeProps) {
  const nearLimit = replyBody.length >= DISCUSSION_REPLY_NEAR_LIMIT;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <MessageCircle
          className="size-3.5 shrink-0 text-apex-primary"
          strokeWidth={1.75}
          aria-hidden
        />
        <h3 className="font-apex-headline text-[10px] uppercase tracking-[0.2em] text-apex-on-surface-variant">
          Add a reply
        </h3>
      </div>

      {replyError && (
        <p className="font-apex-body text-xs text-apex-error">{replyError}</p>
      )}

      <div className="flex items-end gap-2.5">
        <Textarea
          className={cn(
            appManualTextareaClassName,
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
          className={cn("h-9 shrink-0 px-5 text-xs", appPrimaryButtonClassName)}
        >
          {posting ? "Posting…" : "Post"}
        </Button>
      </div>

      {nearLimit && (
        <p className="font-apex-body text-[10px] text-apex-on-surface-variant">
          {replyBody.length}/2000
        </p>
      )}
    </div>
  );
}
