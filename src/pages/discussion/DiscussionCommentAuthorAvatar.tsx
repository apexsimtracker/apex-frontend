import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDiscussionAuthorDisplay,
  getDiscussionAuthorInitials,
} from "@/lib/utils";
import { resolveDiscussionAvatarSrc } from "@/lib/api";

type DiscussionCommentAuthorAvatarProps = {
  author: unknown;
};

export default function DiscussionCommentAuthorAvatar({
  author,
}: DiscussionCommentAuthorAvatarProps) {
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
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-apex-surface-container-high font-apex-body text-xs font-medium text-apex-on-surface-variant"
      aria-label={`Avatar for ${label}`}
    >
      {initials}
    </div>
  );
}
