export function clampModerationPage(
  page: number,
  totalPages: number
): number {
  return Math.max(1, Math.min(page, totalPages || 1));
}

export function pageAfterRemovingItem(
  page: number,
  currentPageItemCount: number
): number {
  return currentPageItemCount === 1 && page > 1 ? page - 1 : page;
}
