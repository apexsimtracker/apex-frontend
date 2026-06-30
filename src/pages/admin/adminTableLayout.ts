/** Shared layout classes for admin list tables (horizontal scroll + row alignment). */

export const ADMIN_PAGE = "mx-auto min-w-0 max-w-6xl";

export const ADMIN_TABLE_CARD =
  "min-w-0 overflow-hidden rounded-xl border border-white/10";

export const ADMIN_TABLE_SCROLL = "overflow-x-auto overscroll-x-contain";

export function adminTable(minWidth: string) {
  return `w-full ${minWidth} text-left text-sm`;
}

export const ADMIN_TH = "whitespace-nowrap p-3";

export const ADMIN_TD = "p-3 align-middle";

export const ADMIN_TD_ACTIONS = "whitespace-nowrap p-3 text-right align-middle";
