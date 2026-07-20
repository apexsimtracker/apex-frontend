import DiscussionCommentsPagination from "@/pages/discussion/DiscussionCommentsPagination";

type AppListPaginationFooterProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Shared numbered pagination footer matching `/discussion/:id` comment pagination.
 */
export default function AppListPaginationFooter({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  disabled = false,
  className,
}: AppListPaginationFooterProps) {
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={className}>
      <p className="mb-3 text-center font-apex-body text-xs text-apex-on-surface-variant">
        Showing {start}–{end} of {total}
      </p>
      <DiscussionCommentsPagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        disabled={disabled}
      />
    </div>
  );
}
