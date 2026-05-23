const STAT_LINE_PATTERNS = [
  /^\d+ sessions this week vs \d+ last$/i,
  /^\d+ laps this week vs \d+ last$/i,
  /^.+ on track this week vs .+ last$/i,
] as const;

function isStatLine(line: string): boolean {
  return STAT_LINE_PATTERNS.some((pattern) => pattern.test(line));
}

/** Split TREND-01 copy into stat bullets and a coaching takeaway. */
export function parseTrendInsight(insight: string): {
  stats: string[];
  coaching: string | null;
} {
  const parts = insight
    .split(/\.\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { stats: [], coaching: null };
  }

  const stats: string[] = [];
  const coachingParts: string[] = [];

  for (const part of parts) {
    if (isStatLine(part)) {
      stats.push(part);
    } else {
      coachingParts.push(part);
    }
  }

  if (stats.length === 0) {
    return { stats: [], coaching: insight.trim() || null };
  }

  return {
    stats,
    coaching: coachingParts.length > 0 ? coachingParts.join(" ") : null,
  };
}
