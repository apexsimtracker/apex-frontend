import { getDiscussionCategoryLabel } from "@/lib/api";
import { cn } from "@/lib/utils";

type DiscussionCategoryBadgeV2Props = {
  isPinned?: boolean;
  categoryKey: string;
  className?: string;
};

export default function DiscussionCategoryBadgeV2({
  isPinned,
  categoryKey,
  className,
}: DiscussionCategoryBadgeV2Props) {
  const label = isPinned
    ? "PINNED"
    : getDiscussionCategoryLabel(categoryKey).toUpperCase();

  return (
    <span
      className={cn(
        "shrink-0 rounded bg-v2-primary px-2 py-0.5 font-v2-body text-[8px] font-bold uppercase tracking-widest text-white",
        className,
      )}
    >
      {label}
    </span>
  );
}
