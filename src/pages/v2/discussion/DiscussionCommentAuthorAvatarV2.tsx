import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDiscussionAuthorDisplay,
  getDiscussionAuthorInitials,
} from "@/lib/utils";
import { resolveDiscussionAvatarSrc } from "@/lib/api";

type DiscussionCommentAuthorAvatarV2Props = {
  author: unknown;
};

export default function DiscussionCommentAuthorAvatarV2({
  author,
}: DiscussionCommentAuthorAvatarV2Props) {
  const { user } = useAuth();
  const label = getDiscussionAuthorDisplay(author);
  const src = resolveDiscussionAvatarSrc(author, user);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src, user?.id, user?.avatarUrl]);

  const initials = getDiscussionAuthorInitials(label);

  if (src?.trim() && !failed) {
    return (
      <img
        src={src}
        alt={label}
        className="size-9 shrink-0 rounded-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-v2-surface-container-high font-v2-body text-xs font-medium text-v2-on-surface-variant"
      aria-label={`Avatar for ${label}`}
    >
      {initials}
    </div>
  );
}
