type SessionDetailConsistencyV2Props = {
  consistency: number | null;
};

const PANEL =
  "rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-6";

function consistencyLabel(score: number | null): string {
  if (score == null) return "Complete 3+ laps to score";
  if (score >= 85) return "Elite consistency";
  if (score >= 65) return "Solid consistency";
  return "Needs consistency";
}

export default function SessionDetailConsistencyV2({
  consistency,
}: SessionDetailConsistencyV2Props) {
  return (
    <section className={PANEL}>
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        Consistency Score
      </h2>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="font-v2-headline text-3xl font-extrabold tabular-nums text-v2-on-surface">
          {consistency == null ? "—" : consistency}
          {consistency != null && (
            <span className="font-v2-body text-base font-normal text-v2-on-surface-variant">
              /100
            </span>
          )}
        </div>
        <p className="font-v2-body text-sm text-v2-on-surface-variant">
          {consistencyLabel(consistency)}
        </p>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-v2-sm bg-v2-surface-container-highest">
        <div
          className="h-full rounded-v2-sm bg-v2-primary/60 transition-all"
          style={{ width: `${consistency ?? 0}%` }}
        />
      </div>
    </section>
  );
}
