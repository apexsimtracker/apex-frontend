import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PersonalBestsPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export default function PersonalBestsPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className,
}: PersonalBestsPaginationProps) {
  if (totalPages <= 1) return null;

  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 sm:flex-row sm:justify-between",
        className,
      )}
    >
      <p className="font-apex-body text-xs text-apex-on-surface-variant">
        Showing {rangeStart}–{rangeEnd} of {total}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-apex-sm border border-apex-outline-variant/20 bg-apex-surface-container px-3 py-2 font-apex-body text-sm font-medium text-apex-on-surface transition-colors hover:bg-apex-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </button>
        <span className="font-apex-body text-sm text-apex-on-surface-variant">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-apex-sm border border-apex-outline-variant/20 bg-apex-surface-container px-3 py-2 font-apex-body text-sm font-medium text-apex-on-surface transition-colors hover:bg-apex-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
