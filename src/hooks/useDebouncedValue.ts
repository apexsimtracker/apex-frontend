import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Returns `value` after it has stayed unchanged for `delayMs` (trailing debounce).
 *
 * @param flushWhenKey — When this value changes, debounced output is **immediately** set to the
 *   current `value` (use to avoid stale debounced state after opening a modal, etc.). Omit for
 *   plain debounce-only behavior.
 */
export function useDebouncedValue<T>(
  value: T,
  delayMs: number,
  flushWhenKey?: unknown
): T {
  const [debounced, setDebounced] = useState(value);
  const prevFlushKey = useRef(flushWhenKey);

  useLayoutEffect(() => {
    if (flushWhenKey === undefined) return;
    if (prevFlushKey.current !== flushWhenKey) {
      prevFlushKey.current = flushWhenKey;
      setDebounced(value);
    }
  }, [flushWhenKey, value]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
