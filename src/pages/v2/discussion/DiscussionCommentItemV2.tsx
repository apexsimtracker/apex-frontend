import { getDiscussionAuthorDisplay, timeAgo } from "@/lib/utils";
import type { DiscussionComment } from "@/lib/api";
import DiscussionCommentAuthorAvatarV2 from "./DiscussionCommentAuthorAvatarV2";
import DiscussionCommentBodyV2 from "./DiscussionCommentBodyV2";

type DiscussionCommentItemV2Props = {
  comment: DiscussionComment;
};

export default function DiscussionCommentItemV2({
  comment,
}: DiscussionCommentItemV2Props) {
  return (
    <li>
      <article className="rounded-xl border-l-2 border-l-v2-primary/50 bg-v2-surface-container-low p-4 sm:p-5">
        <div className="mb-3 flex items-start gap-3 sm:mb-4 sm:gap-4">
          <DiscussionCommentAuthorAvatarV2 author={comment.author} />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-v2-body text-sm font-bold leading-none text-v2-on-surface">
              {getDiscussionAuthorDisplay(comment.author)}
            </p>
            <p className="mt-1.5 font-v2-body text-xs text-v2-on-surface-variant">
              {timeAgo(comment.createdAt)}
            </p>
          </div>
        </div>
        <DiscussionCommentBodyV2 body={comment.body} />
      </article>
    </li>
  );
}
