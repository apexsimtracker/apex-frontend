import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  appManualTextareaClassName,
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import CommentItem from "./CommentItem";
import type { ThreadComment } from "./commentTypes";
import { canReplyToThreadComment, nextRepliesLabel } from "./commentUi";
import CommentDeleteConfirmationModal from "./CommentDeleteConfirmationModal";

type CommentThreadProps = {
  comment: ThreadComment;
  variant: "discussion" | "session";
  currentUserId?: string | null;
  isAdmin?: boolean;
  signedIn: boolean;
  maxLength: number;
  replyOpen: boolean;
  editingId: string | null;
  editError?: string | null;
  replyError?: string | null;
  onToggleReply: (rootId: string) => void;
  onToggleEdit: (commentId: string | null) => void;
  onSubmitReply: (rootId: string, body: string) => void;
  onSubmitEdit: (commentId: string, body: string) => void;
  onDelete: (commentId: string) => void;
  onLoadMoreReplies?: (rootId: string) => void;
  posting?: boolean;
  loadingMore?: boolean;
};

function InlineComposer({
  initial,
  maxLength,
  submitLabel,
  onSubmit,
  onCancel,
  disabled,
  error,
}: {
  initial?: string;
  maxLength: number;
  submitLabel: string;
  onSubmit: (body: string) => void;
  onCancel: () => void;
  disabled?: boolean;
  error?: string | null;
}) {
  const [value, setValue] = useState(initial ?? "");
  const over = value.length > maxLength;
  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        disabled={disabled}
        className={cn(
          appManualTextareaClassName,
          "max-h-24 min-h-[2.75rem] resize-none px-3 py-2 text-sm",
        )}
        placeholder={
          submitLabel === "Save" ? "Edit comment…" : "Write a reply…"
        }
        aria-label={submitLabel === "Save" ? "Edit comment" : "Reply"}
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            appOutlineButtonClassName,
            "inline-flex h-8 items-center justify-center px-4 text-xs",
          )}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={disabled || !value.trim() || over}
          onClick={() => onSubmit(value.trim())}
          className={cn(
            appPrimaryButtonClassName,
            "inline-flex h-8 items-center justify-center px-4 text-xs leading-none",
          )}
        >
          {submitLabel}
        </button>
      </div>
      {error ? (
        <p className="font-apex-body text-xs text-apex-error">{error}</p>
      ) : null}
    </div>
  );
}

export default function CommentThread({
  comment,
  variant,
  currentUserId,
  isAdmin,
  signedIn,
  maxLength,
  replyOpen,
  editingId,
  editError,
  replyError,
  onToggleReply,
  onToggleEdit,
  onSubmitReply,
  onSubmitEdit,
  onDelete,
  onLoadMoreReplies,
  posting,
  loadingMore,
}: CommentThreadProps) {
  const replies = comment.replies ?? [];
  const replyCount = comment.replyCount ?? replies.length;
  const canReply = canReplyToThreadComment(comment, signedIn);
  const [expanded, setExpanded] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    isReply: boolean;
    hasReplies: boolean;
  } | null>(null);

  const composerFor = (targetId: string, isEdit: boolean, initial?: string) => {
    if (isEdit && editingId === targetId) {
      return (
        <InlineComposer
          initial={initial}
          maxLength={maxLength}
          submitLabel="Save"
          disabled={posting}
          error={editError}
          onCancel={() => onToggleEdit(null)}
          onSubmit={(body) => onSubmitEdit(targetId, body)}
        />
      );
    }
    return null;
  };

  return (
    <>
      <li className="space-y-2">
        <CommentItem
          comment={comment}
          variant={variant}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          signedIn={signedIn}
          onReply={canReply ? () => onToggleReply(comment.id) : undefined}
          onEdit={
            comment.deletedAt ? undefined : () => onToggleEdit(comment.id)
          }
          onDelete={
            comment.deletedAt
              ? undefined
              : () =>
                  setPendingDelete({
                    id: comment.id,
                    isReply: false,
                    hasReplies: replyCount > 0,
                  })
          }
          composer={
            <>
              {composerFor(comment.id, true, comment.body)}
              {canReply && replyOpen && editingId !== comment.id ? (
                <InlineComposer
                  maxLength={maxLength}
                  submitLabel="Post"
                  disabled={posting}
                  error={replyError}
                  onCancel={() => onToggleReply(comment.id)}
                  onSubmit={(body) => onSubmitReply(comment.id, body)}
                />
              ) : null}
            </>
          }
        />

        {replyCount > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-4 font-apex-body text-xs font-medium text-apex-primary hover:text-apex-primary/80"
          >
            {expanded
              ? `Hide ${replies.length} ${
                  replies.length === 1 ? "reply" : "replies"
                }`
              : `Show ${replies.length} ${
                  replies.length === 1 ? "reply" : "replies"
                }`}
          </button>
        ) : null}

        {expanded && replies.length > 0 ? (
          <ul className="ml-4 space-y-2 border-l border-apex-outline-variant/20 pl-3 sm:ml-6 sm:pl-4">
            {replies.map((reply) => (
              <li key={reply.id}>
                <CommentItem
                  comment={reply}
                  variant={variant}
                  isReply
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  signedIn={signedIn}
                  onEdit={
                    reply.deletedAt ? undefined : () => onToggleEdit(reply.id)
                  }
                  onDelete={
                    reply.deletedAt
                      ? undefined
                      : () =>
                          setPendingDelete({
                            id: reply.id,
                            isReply: true,
                            hasReplies: false,
                          })
                  }
                  composer={composerFor(reply.id, true, reply.body)}
                />
              </li>
            ))}
          </ul>
        ) : null}

        {expanded && comment.hasMoreReplies && onLoadMoreReplies ? (
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => onLoadMoreReplies(comment.id)}
            className="ml-4 font-apex-body text-xs font-medium text-apex-primary hover:text-apex-primary/80 disabled:opacity-60"
          >
            {nextRepliesLabel(Boolean(loadingMore), replyCount, replies.length)}
          </button>
        ) : null}
      </li>
      <CommentDeleteConfirmationModal
        open={pendingDelete != null}
        isReply={pendingDelete?.isReply ?? false}
        hasReplies={pendingDelete?.hasReplies ?? false}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
