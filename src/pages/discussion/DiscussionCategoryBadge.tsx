import { getDiscussionCategoryLabel } from "@/lib/api";
import { cn } from "@/lib/utils";

type DiscussionCategoryBadgeProps = {
  isPinned?: boolean;
  categoryKey: string;
  className?: string;
};

export default function DiscussionCategoryBadge({
  isPinned,
  categoryKey,
  className,
}: DiscussionCategoryBadgeProps) {
  const label = isPinned
    ? "PINNED"
    : getDiscussionCategoryLabel(categoryKey).toUpperCase();

  return (
    <span
      className={cn(
        "shrink-0 rounded bg-apex-primary px-2 py-0.5 font-apex-body text-[8px] font-bold uppercase tracking-widest text-white",
        className,
      )}
    >
      {label}
    </span>
  );
}
