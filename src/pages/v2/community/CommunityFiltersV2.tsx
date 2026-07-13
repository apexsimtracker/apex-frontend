import { Search, X } from "lucide-react";
import { SkeletonBlock } from "@/components/ui/skeleton";
import V2NativeSelect from "@/components/v2/ui/V2NativeSelect";
import {
  DISCUSSION_CATEGORIES,
  DISCUSSION_LIST_SORT_OPTIONS,
  type DiscussionCategory,
  type DiscussionCategoryCounts,
  type DiscussionListSort,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function getCategoryChipLabel(value: DiscussionCategory): string {
  if (value === "all") return "All Posts";
  const row = DISCUSSION_CATEGORIES.find((c) => c.value === value);
  return row?.label ?? value;
}

type CommunityFiltersV2Props = {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onClearSearch: () => void;
  sortBy: DiscussionListSort;
  onSortChange: (value: DiscussionListSort) => void;
  selectedCategory: DiscussionCategory;
  onCategoryChange: (value: DiscussionCategory) => void;
  categoryCounts: DiscussionCategoryCounts;
  categoryCountsPending: boolean;
  hasActiveFilters: boolean;
  onClear: () => void;
  className?: string;
};

export default function CommunityFiltersV2({
  searchInput,
  onSearchInputChange,
  onClearSearch,
  sortBy,
  onSortChange,
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  categoryCountsPending,
  hasActiveFilters,
  onClear,
  className,
}: CommunityFiltersV2Props) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search
            className="absolute left-3 top-3 size-4 text-v2-on-surface-variant/60"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Search titles and post content"
            className="w-full rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container py-2.5 pl-10 pr-10 font-v2-body text-sm text-v2-on-surface transition-colors placeholder:text-v2-on-surface-variant/60 focus:border-v2-primary/40 focus:outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />
          {searchInput.length > 0 ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-v2-primary transition-colors hover:text-v2-primary/80"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <V2NativeSelect
          value={sortBy}
          onChange={(event) =>
            onSortChange(event.target.value as DiscussionListSort)
          }
          aria-label="Sort discussions"
          className="sm:min-w-[160px] sm:flex-1"
        >
          {DISCUSSION_LIST_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </V2NativeSelect>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-lg border border-v2-outline-variant/20 px-3 font-v2-body text-sm text-v2-on-surface-variant transition-colors hover:bg-v2-surface-container hover:text-v2-on-surface"
          >
            <X className="size-4 text-v2-primary" aria-hidden />
            Clear
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DISCUSSION_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onCategoryChange(cat.value)}
              className={cn(
                "flex items-center justify-center gap-1 rounded p-2 font-v2-body text-[10px] font-bold uppercase transition-colors",
                isActive
                  ? "bg-v2-primary text-white"
                  : "bg-v2-surface-container-low text-v2-on-surface-variant",
              )}
            >
              <span className="truncate">
                {getCategoryChipLabel(cat.value)}
              </span>
              <span
                className={cn(
                  "shrink-0 font-semibold tabular-nums",
                  isActive
                    ? "text-white/80"
                    : "text-v2-on-surface-variant/60",
                )}
              >
                {categoryCountsPending ? (
                  <SkeletonBlock className="h-2.5 w-4 rounded" />
                ) : (
                  `(${categoryCounts[cat.value]})`
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
