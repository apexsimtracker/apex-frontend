import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";

import type { ProfileSummary } from "@/lib/api";
import { parseTrendInsight } from "@/lib/parseTrendInsight";

type ApexTrendInsight = NonNullable<ProfileSummary["apexTrendInsight"]>;

const EMPTY_INSIGHT_COPY = "Drive a session this week to see your pace trend.";

function TrendInsightContent({ insight }: { insight: string }) {
  const { stats, coaching } = parseTrendInsight(insight);

  if (stats.length === 0) {
    return (
      <p className="mt-3 font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
        {insight}
      </p>
    );
  }

  return (
    <div className="mt-3">
      <ul className="space-y-2">
        {stats.map((line) => (
          <li
            key={line}
            className="flex items-start gap-2.5 font-apex-body text-sm leading-relaxed text-apex-on-surface-variant"
          >
            <span
              className="mt-2 size-1.5 shrink-0 rounded-full bg-apex-on-surface-variant/40"
              aria-hidden
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {coaching && (
        <div className="mt-4 flex items-start gap-2.5 border-t border-apex-outline-variant/10 pt-4">
          <Sparkles
            className="mt-0.5 size-4 shrink-0 text-apex-primary"
            aria-hidden
          />
          <p className="font-apex-body text-sm leading-relaxed text-apex-on-surface">
            {coaching}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ApexAnalysisTrendCard({
  trend,
}: {
  trend: ApexTrendInsight;
}) {
  const isLocked = trend.locked === true;
  const insight = !isLocked && "insight" in trend ? trend.insight : null;
  const hasInsight = Boolean(insight);

  return (
    <section
      className="rounded-2xl border border-apex-outline-variant/10 bg-apex-surface-container-low p-5"
      aria-labelledby="apex-analysis-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2
            id="apex-analysis-heading"
            className="font-apex-headline text-base font-semibold text-apex-on-surface"
          >
            Apex Analysis
          </h2>
          <p className="mt-0.5 font-apex-body text-[11px] uppercase tracking-wider text-apex-on-surface-variant">
            Weekly coaching
          </p>
        </div>
      </div>

      {isLocked ? (
        <div className="mt-4 rounded-xl border border-apex-outline-variant/20 bg-apex-surface-container-high/40 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-2.5">
              <Lock
                className="mt-0.5 size-4 shrink-0 text-apex-primary"
                aria-hidden
              />
              <p className="font-apex-body text-sm leading-relaxed text-apex-on-surface">
                {trend.message}
              </p>
            </div>
            <Link
              to={"/pricing"}
              className="shrink-0 self-start rounded-apex-sm bg-apex-primary px-3 py-1.5 font-apex-headline text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-apex-primary/90 sm:ml-3"
            >
              Upgrade to Apex Pro
            </Link>
          </div>
        </div>
      ) : hasInsight && insight ? (
        <TrendInsightContent insight={insight} />
      ) : (
        <p className="mt-3 font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
          {EMPTY_INSIGHT_COPY}
        </p>
      )}
    </section>
  );
}
