import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BaseModal } from "@/components/ui/base-modal";
import { Textarea } from "@/components/ui/textarea";
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
        <BaseModal
            isOpen={open}
            onClose={closeModal}
            title="Add a reply"
            size="md"
            mobileVariant="fullscreen"
            footer={
                <>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={closeModal}
                        disabled={posting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onPostReply}
                        disabled={!replyBody.trim() || posting}
                    >
                        {posting ? "Posting…" : "Post reply"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {replyError && (
                    <p className="text-sm text-destructive">{replyError}</p>
                )}
                <Textarea
                    ref={textareaRef}
                    className="min-h-[160px] resize-y border-white/10 bg-secondary"
                    rows={4}
                    placeholder="Write a reply…"
                    value={replyBody}
                    onChange={(e) => onReplyBodyChange(e.target.value)}
                    disabled={posting}
                />
                {nearLimit && (
                    <p className="text-xs text-muted-foreground">
                        Approaching 2,000 character limit ({replyBody.length}
                        /2000)
                    </p>
                )}
            </div>
        </BaseModal>
    );
}
