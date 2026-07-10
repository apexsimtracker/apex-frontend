type SessionDetailLapConsistencyV2Props = {
  consistencyText: string;
};

const CARD = "rounded-xl bg-v2-surface-container-low p-4 shadow-lg";

// NOTE(dummy): Per-lap consistency dots and description are static.
const CONSISTENCY_DOTS = [
  "bg-green-500",
  "bg-green-500",
  "bg-yellow-400",
  "bg-green-500",
  "bg-green-500",
] as const;

export default function SessionDetailLapConsistencyV2({
  consistencyText,
}: SessionDetailLapConsistencyV2Props) {
  return (
    <section className={CARD}>
      <h2 className="mb-3 font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
        Lap consistency
      </h2>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-v2-body text-xs text-v2-on-surface-variant">
            Consistency
          </span>
          <div className="flex gap-1">
            {CONSISTENCY_DOTS.map((color, i) => (
              <span
                key={i}
                className={`size-2.5 rounded-full ${color}`}
                aria-hidden
              />
            ))}
          </div>
        </div>
        <span className="font-v2-headline text-sm font-bold text-green-500">
          {consistencyText}
        </span>
      </div>
      <p className="font-v2-body text-[11px] text-v2-on-surface-variant/70">
        4 of 5 laps within 0.8s of your best. Strong session.
      </p>
    </section>
  );
}
