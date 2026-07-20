import { getDiscussionAuthorDisplay, timeAgo } from "@/lib/utils";
import type { DiscussionComment } from "@/lib/api";
import DiscussionCommentAuthorAvatar from "./DiscussionCommentAuthorAvatar";
import DiscussionCommentBody from "./DiscussionCommentBody";

type DiscussionCommentItemProps = {
  comment: DiscussionComment;
};

export default function DiscussionCommentItem({
  comment,
}: DiscussionCommentItemProps) {
  return (
    <li>
      <article className="rounded-xl border-l-2 border-l-apex-primary/50 bg-apex-surface-container-low p-4 sm:p-5">
        <div className="mb-3 flex items-start gap-3 sm:mb-4 sm:gap-4">
          <DiscussionCommentAuthorAvatar author={comment.author} />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-apex-body text-sm font-bold leading-none text-apex-on-surface">
              {getDiscussionAuthorDisplay(comment.author)}
            </p>
            <p className="mt-1.5 font-apex-body text-xs text-apex-on-surface-variant">
              {timeAgo(comment.createdAt)}
            </p>
          </div>
        </div>
        <DiscussionCommentBody body={comment.body} />
      </article>
    </li>
  );
}
