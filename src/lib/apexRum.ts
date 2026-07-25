/**
 * Phase 0 RUM: opt-in client timing for document navigation + API fetches.
 * Enable with `localStorage.setItem("apex_rum", "1")` or `?apex_rum=1`.
 */

const RUM_FLAG = "apex_rum";

function rumEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get(RUM_FLAG) === "1") {
      return true;
    }
    return window.localStorage?.getItem(RUM_FLAG) === "1";
  } catch {
    return false;
  }
}

function logRum(event: string, data: Record<string, unknown>): void {
  if (!rumEnabled()) return;
  console.info(`[apex-rum] ${event}`, data);
}

/** Capture Navigation Timing / LCP once after first paint. */
export function initApexRum(): void {
  if (typeof window === "undefined" || !rumEnabled()) return;

  const nav = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming | undefined;
  if (nav) {
    logRum("navigation", {
      ttfbMs: Math.round(nav.responseStart - nav.requestStart),
      domContentLoadedMs: Math.round(
        nav.domContentLoadedEventEnd - nav.startTime,
      ),
      loadEventMs: Math.round(nav.loadEventEnd - nav.startTime),
      transferSize: nav.transferSize,
    });
  }

  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "largest-contentful-paint") {
          logRum("lcp", { lcpMs: Math.round(entry.startTime) });
        }
      }
    });
    po.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    // Older browsers / unsupported
  }
}

/** Record one API call (TTFB + optional Server-Timing). */
export function recordApiTiming(
  method: string,
  path: string,
  res: Response,
  startedAt: number,
): void {
  if (!rumEnabled()) return;
  const totalMs = Math.round(performance.now() - startedAt);
  const serverTiming = res.headers.get("server-timing");
  logRum("api", {
    method,
    path,
    status: res.status,
    totalMs,
    serverTiming: serverTiming ?? undefined,
  });
}
