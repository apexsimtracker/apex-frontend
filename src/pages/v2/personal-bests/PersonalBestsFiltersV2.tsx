import { Search, X } from "lucide-react";
import V2NativeSelect from "@/components/v2/ui/V2NativeSelect";
import { formatCarName } from "@/lib/utils";
import { formatTrackName } from "@/lib/tracks";
import { cn } from "@/lib/utils";

type PersonalBestsFiltersV2Props = {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  track: string;
  onTrackChange: (value: string) => void;
  car: string;
  onCarChange: (value: string) => void;
  trackOptions: string[];
  carOptions: string[];
  onClearSearch: () => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  className?: string;
};

export default function PersonalBestsFiltersV2({
  searchInput,
  onSearchInputChange,
  track,
  onTrackChange,
  car,
  onCarChange,
  trackOptions,
  carOptions,
  onClearSearch,
  onClear,
  hasActiveFilters,
  className,
}: PersonalBestsFiltersV2Props) {
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
            placeholder="Search track or car"
            className="w-full rounded-v2-sm border border-v2-outline-variant/15 bg-v2-surface-container py-2.5 pl-10 pr-10 font-v2-body text-sm text-v2-on-surface transition-colors placeholder:text-v2-on-surface-variant/60 focus:border-v2-primary/40 focus:outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
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
          value={track}
          onChange={(event) => onTrackChange(event.target.value)}
          aria-label="Filter by track"
          className="sm:min-w-[160px] sm:flex-1"
        >
          <option value="">All tracks</option>
          {trackOptions.map((trackKey) => (
            <option key={trackKey} value={trackKey}>
              {formatTrackName(trackKey)}
            </option>
          ))}
        </V2NativeSelect>

        <V2NativeSelect
          value={car}
          onChange={(event) => onCarChange(event.target.value)}
          aria-label="Filter by car"
          className="sm:min-w-[160px] sm:flex-1"
        >
          <option value="">All cars</option>
          {carOptions.map((carKey) => (
            <option key={carKey} value={carKey}>
              {formatCarName(carKey)}
            </option>
          ))}
        </V2NativeSelect>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-v2-sm border border-v2-outline-variant/20 px-3 font-v2-body text-sm text-v2-on-surface-variant transition-colors hover:bg-v2-surface-container hover:text-v2-on-surface"
          >
            <X className="size-4 text-v2-primary" aria-hidden />
            Clear
          </button>
        ) : null}
      </div>
    </section>
  );
}
