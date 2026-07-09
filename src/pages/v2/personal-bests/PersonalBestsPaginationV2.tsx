import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PersonalBestsPaginationV2Props = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export default function PersonalBestsPaginationV2({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className,
}: PersonalBestsPaginationV2Props) {
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
      <p className="font-v2-body text-xs text-v2-on-surface-variant">
        Showing {rangeStart}–{rangeEnd} of {total}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-v2-sm border border-v2-outline-variant/20 bg-v2-surface-container px-3 py-2 font-v2-body text-sm font-medium text-v2-on-surface transition-colors hover:bg-v2-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </button>
        <span className="font-v2-body text-sm text-v2-on-surface-variant">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-v2-sm border border-v2-outline-variant/20 bg-v2-surface-container px-3 py-2 font-v2-body text-sm font-medium text-v2-on-surface transition-colors hover:bg-v2-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
