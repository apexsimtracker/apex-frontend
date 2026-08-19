import type { ClipboardEvent, KeyboardEvent } from "react";

/**
 * `<input type="number">` treats `e`/`E`/`+`/`-` as scientific notation and
 * reports any unparseable content as an empty string, so typing "e" silently
 * blanks the field with no validation error. Spread these props onto whole
 * number inputs to keep them to digits.
 */
const BLOCKED_NUMBER_KEYS = new Set(["e", "E", "+", "-", ".", ","]);

export const wholeNumberInputProps = {
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (BLOCKED_NUMBER_KEYS.has(event.key)) event.preventDefault();
  },
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").trim();
    if (!/^\d*$/.test(pasted)) event.preventDefault();
  },
} as const;

/** Lap and sector times are digits plus the `m:ss.mmm` separators — nothing else. */
export function stripLapTimeChars(value: string): string {
  return value.replace(/[^\d:.,]/g, "");
}
