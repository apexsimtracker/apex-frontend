import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DiscussionCommentsPaginationProps = {
  /** Current page (1-based). */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
};

const linkBase = cn(
  "inline-flex min-w-[2.25rem] cursor-pointer items-center justify-center rounded-apex-sm",
  "border border-apex-outline-variant/20 bg-apex-surface-container px-3 py-1.5",
  "font-apex-body text-sm text-apex-on-surface transition-colors hover:bg-apex-surface-container-high",
);

const navBase = cn(
  "inline-flex cursor-pointer items-center gap-1 rounded-apex-sm",
  "border border-apex-outline-variant/20 bg-apex-surface-container px-3 py-1.5",
  "font-apex-body text-sm text-apex-on-surface transition-colors hover:bg-apex-surface-container-high",
);

function useCompactPagination(): boolean {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 430px)");
    const update = () => setIsCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isCompact;
}

export default function DiscussionCommentsPagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  className,
}: DiscussionCommentsPaginationProps) {
  const isCompact = useCompactPagination();

  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(disabled && "pointer-events-none opacity-50", className)}
    >
      <ReactPaginate
        forcePage={page - 1}
        pageCount={totalPages}
        pageRangeDisplayed={isCompact ? 0 : 3}
        marginPagesDisplayed={1}
        onPageChange={({ selected }) => onPageChange(selected + 1)}
        disableInitialCallback
        containerClassName="flex flex-wrap items-center justify-center gap-1 sm:gap-2"
        pageClassName="inline-block"
        pageLinkClassName={linkBase}
        activeClassName="!border-apex-primary/45 !bg-apex-primary/10 !font-medium !text-apex-on-surface"
        activeLinkClassName="!border-apex-primary/45 !bg-apex-primary/10"
        previousLabel={
          <span className="inline-flex items-center gap-1">
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Previous</span>
          </span>
        }
        nextLabel={
          <span className="inline-flex items-center gap-1">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </span>
        }
        previousClassName="inline-block"
        nextClassName="inline-block"
        previousLinkClassName={navBase}
        nextLinkClassName={navBase}
        disabledClassName="pointer-events-none opacity-40"
        breakLabel="…"
        breakClassName="inline-flex items-center px-2 font-apex-body text-sm text-apex-on-surface-variant"
        renderOnZeroPageCount={null}
      />
    </div>
  );
}
