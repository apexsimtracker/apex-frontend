type ConsistencyDot = "green" | "yellow" | "red" | "muted";

type SessionDetailLapConsistencyProps = {
  consistencyText: string;
  dots: ConsistencyDot[];
  narrative: string;
};

const CARD = "rounded-xl bg-apex-surface-container-low p-4 shadow-lg";

const DOT_CLASS: Record<ConsistencyDot, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
  muted: "bg-apex-outline-variant/40",
};

export function buildConsistencyVisual(
  lapTimesMs: number[],
  bestLapMs: number | null,
): { dots: ConsistencyDot[]; narrative: string } {
  if (lapTimesMs.length === 0 || bestLapMs == null || !Number.isFinite(bestLapMs)) {
    return {
      dots: [],
      narrative: "Not enough valid laps to score consistency.",
    };
  }

  const thresholdMs = 800;
  const dots: ConsistencyDot[] = lapTimesMs.map((t) => {
    const delta = t - bestLapMs;
    if (delta <= thresholdMs) return "green";
    if (delta <= thresholdMs * 2) return "yellow";
    return "red";
  });

  const within = dots.filter((d) => d === "green").length;
  const narrative =
    within === lapTimesMs.length
      ? `All ${lapTimesMs.length} laps within 0.8s of your best.`
      : `${within} of ${lapTimesMs.length} laps within 0.8s of your best.`;

  return { dots, narrative };
}

export default function SessionDetailLapConsistency({
  consistencyText,
  dots,
  narrative,
}: SessionDetailLapConsistencyProps) {
  return (
    <section className={CARD}>
      <h2 className="mb-3 font-apex-headline text-lg font-bold tracking-tight text-apex-on-surface">
        Lap consistency
      </h2>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="shrink-0 font-apex-body text-xs text-apex-on-surface-variant">
            Consistency
          </span>
          <div className="flex flex-wrap gap-1">
            {dots.length === 0 ? (
              <span className="font-apex-body text-[11px] text-apex-on-surface-variant">
                —
              </span>
            ) : (
              dots.map((color, i) => (
                <span
                  key={i}
                  className={`size-2.5 rounded-full ${DOT_CLASS[color]}`}
                  aria-hidden
                />
              ))
            )}
          </div>
        </div>
        <span className="shrink-0 font-apex-headline text-sm font-bold text-green-500">
          {consistencyText}
        </span>
      </div>
      <p className="font-apex-body text-[11px] text-apex-on-surface-variant/70">
        {narrative}
      </p>
    </section>
  );
}
