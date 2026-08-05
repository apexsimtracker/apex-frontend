import { Search, X } from "lucide-react";
import { SkeletonBlock } from "@/components/ui/skeleton";
import AppNativeSelect from "@/components/app-ui/AppNativeSelect";
import {
  DISCUSSION_CATEGORIES,
  DISCUSSION_LIST_SORT_OPTIONS,
  type DiscussionCategory,
  type DiscussionCategoryCounts,
  type DiscussionListSort,
} from "@/lib/api/community";
import { cn } from "@/lib/utils";

function getCategoryChipLabel(value: DiscussionCategory): string {
  if (value === "all") return "All Posts";
  const row = DISCUSSION_CATEGORIES.find((c) => c.value === value);
  return row?.label ?? value;
}

type CommunityFiltersProps = {
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

export default function CommunityFilters({
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
}: CommunityFiltersProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search
            className="absolute left-3 top-3 size-4 text-apex-on-surface-variant/60"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Search titles and post content"
            className="w-full rounded-lg border border-apex-outline-variant/15 bg-apex-surface-container py-2.5 pl-10 pr-10 font-apex-body text-sm text-apex-on-surface transition-colors placeholder:text-apex-on-surface-variant/60 focus:border-apex-primary/40 focus:outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />
          {searchInput.length > 0 ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-apex-primary transition-colors hover:text-apex-primary/80"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <AppNativeSelect
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
        </AppNativeSelect>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-lg border border-apex-outline-variant/20 px-3 font-apex-body text-sm text-apex-on-surface-variant transition-colors hover:bg-apex-surface-container hover:text-apex-on-surface"
          >
            <X className="size-4 text-apex-primary" aria-hidden />
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
                "flex items-center justify-center gap-1 rounded p-2 font-apex-body text-[10px] font-bold uppercase transition-colors",
                isActive
                  ? "bg-apex-primary text-white"
                  : "bg-apex-surface-container-low text-apex-on-surface-variant",
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
                    : "text-apex-on-surface-variant/60",
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
