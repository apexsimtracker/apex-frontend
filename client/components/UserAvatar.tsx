import { useState } from "react";
import { cn, getUserInitials } from "@/lib/utils";
import { resolveApiUrl } from "@/lib/api/config";

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-9 text-sm",
  lg: "size-16 text-lg sm:size-20",
} as const;

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
  alt?: string;
};

export default function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
  alt,
}: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const resolved = resolveApiUrl(avatarUrl ?? null);
  const showImage = Boolean(resolved?.trim()) && !imgFailed;
  const initials = getUserInitials(name);
  const label = alt ?? name;

  if (showImage && resolved) {
    return (
      <img
        src={resolved}
        alt={label}
        className={cn(
          "shrink-0 rounded-full object-cover ring-1 ring-white/10",
          sizeClasses[size],
          className,
        )}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      role="img"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold text-white/80 ring-1 ring-white/10",
        sizeClasses[size],
        className,
      )}
      aria-label={label}
    >
      {initials}
    </div>
  );
}
