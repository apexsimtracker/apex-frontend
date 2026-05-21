import { BookOpen, LayoutGrid, MessagesSquare, Wrench } from "lucide-react";

const DEFAULT_CLASS = "w-4 h-4 shrink-0";

/**
 * Stable SVG icons for discussion categories (avoid emoji — they break on some OS/fonts).
 * Keys match API: all | setup | guides | general
 */
export function DiscussionCategoryIcon({
  categoryKey,
  className = DEFAULT_CLASS,
}: {
  categoryKey: string;
  className?: string;
}) {
  const k = String(categoryKey ?? "")
    .trim()
    .toLowerCase();
  const common = { className, "aria-hidden": true as const };
  switch (k) {
    case "all":
      return <LayoutGrid {...common} />;
    case "setup":
      return <Wrench {...common} />;
    case "guides":
      return <BookOpen {...common} />;
    case "general":
      return <MessagesSquare {...common} />;
    default:
      return <MessagesSquare {...common} />;
  }
}
