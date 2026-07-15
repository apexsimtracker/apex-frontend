import DiscussionCommentsPaginationV2 from "@/pages/v2/discussion/DiscussionCommentsPaginationV2";

type V2ListPaginationFooterProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Shared numbered pagination footer matching `/v2/discussion/:id` comment pagination.
 */
export default function V2ListPaginationFooter({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  disabled = false,
  className,
}: V2ListPaginationFooterProps) {
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={className}>
      <p className="mb-3 text-center font-v2-body text-xs text-v2-on-surface-variant">
        Showing {start}–{end} of {total}
      </p>
      <DiscussionCommentsPaginationV2
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        disabled={disabled}
      />
    </div>
  );
}
