import ReactPaginate from "react-paginate";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type RaceHistoryPaginationProps = {
  /** Current page (1-based). */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

const linkBase =
  "inline-flex items-center justify-center min-w-[2.25rem] px-3 py-1.5 rounded-lg border border-white/10 bg-card/20 text-sm text-foreground/90 hover:bg-white/5 transition-colors";
const navBase =
  "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-card/20 text-sm text-foreground/90 hover:bg-white/5 transition-colors";

export function RaceHistoryPagination({
  page,
  totalPages,
  onPageChange,
  disabled,
}: RaceHistoryPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn(disabled && "pointer-events-none opacity-50")}>
      <ReactPaginate
        forcePage={page - 1}
        pageCount={totalPages}
        pageRangeDisplayed={3}
        marginPagesDisplayed={1}
        onPageChange={({ selected }) => onPageChange(selected + 1)}
        disableInitialCallback
        containerClassName="flex flex-wrap items-center justify-center gap-1 sm:gap-2"
        pageClassName="inline-block"
        pageLinkClassName={cn(linkBase, "cursor-pointer")}
        activeClassName="!border-[rgba(240,28,28,0.45)] !bg-[rgba(240,28,28,0.1)] !text-foreground font-medium"
        activeLinkClassName="!border-[rgba(240,28,28,0.45)] !bg-[rgba(240,28,28,0.1)]"
        previousLabel={
          <span className="inline-flex items-center gap-1">
            <ChevronLeft className="h-4 w-4 shrink-0" />
            Previous
          </span>
        }
        nextLabel={
          <span className="inline-flex items-center gap-1">
            Next
            <ChevronRight className="h-4 w-4 shrink-0" />
          </span>
        }
        previousClassName="inline-block"
        nextClassName="inline-block"
        previousLinkClassName={cn(navBase, "cursor-pointer")}
        nextLinkClassName={cn(navBase, "cursor-pointer")}
        disabledClassName="opacity-40 pointer-events-none"
        breakLabel="…"
        breakClassName="inline-flex items-center px-2 text-muted-foreground text-sm"
        renderOnZeroPageCount={null}
      />
    </div>
  );
}
