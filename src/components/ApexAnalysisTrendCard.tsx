import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import type { ProfileSummary } from "@/lib/api";
import { parseTrendInsight } from "@/lib/parseTrendInsight";

type ApexTrendInsight = NonNullable<ProfileSummary["apexTrendInsight"]>;

const EMPTY_INSIGHT_COPY =
  "Drive a session this week to see your pace trend.";

function TrendInsightContent({ insight }: { insight: string }) {
  const { stats, coaching } = parseTrendInsight(insight);

  if (stats.length === 0) {
    return (
      <p className="mt-3 text-sm leading-relaxed text-white/80">{insight}</p>
    );
  }

  return (
    <div className="mt-3">
      <ul className="space-y-2">
        {stats.map((line) => (
          <li
            key={line}
            className="flex items-start gap-2.5 text-sm leading-relaxed text-white/80"
          >
            <span
              className="mt-2 size-1.5 shrink-0 rounded-full bg-white/35"
              aria-hidden
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {coaching && (
        <div className="mt-4 flex items-start gap-2.5 border-t border-white/5 pt-4">
          <Sparkles
            className="mt-0.5 size-4 shrink-0 text-amber-400/80"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-white/85">{coaching}</p>
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
  const insight =
    !isLocked && "insight" in trend ? trend.insight : null;
  const hasInsight = Boolean(insight);

  return (
    <section
      className="border-white/6 mt-6 rounded-lg border bg-card/20 p-4 backdrop-blur-lg"
      aria-labelledby="apex-analysis-heading"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2
            id="apex-analysis-heading"
            className="text-base font-semibold text-white"
          >
            Apex Analysis
          </h2>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/50">
            Weekly coaching
          </p>
        </div>
      </div>

      {isLocked ? (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/50">
              <Lock className="size-3.5 shrink-0 text-amber-400/80" aria-hidden />
              Pro insight
            </span>
            <Link
              to="/pricing"
              className="shrink-0 rounded-lg bg-amber-500 px-3 py-1 text-xs font-medium text-black transition-colors hover:bg-amber-400"
            >
              Unlock with Pro
            </Link>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            {trend.message}
          </p>
        </div>
      ) : hasInsight && insight ? (
        <TrendInsightContent insight={insight} />
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-white/50">
          {EMPTY_INSIGHT_COPY}
        </p>
      )}
    </section>
  );
}
