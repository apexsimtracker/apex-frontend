import { Link } from "react-router-dom";
import { formatLapMs } from "@/lib/utils";
import type { SessionTimingMinima } from "@/lib/sessionLapDisplay";

type SessionDetailIdealLapV2Props = {
  proFeaturesLocked: boolean;
  sessionMinima: SessionTimingMinima;
  idealLapMs: number | null | undefined;
};

const PANEL =
  "rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-6";

export default function SessionDetailIdealLapV2({
  proFeaturesLocked,
  sessionMinima,
  idealLapMs,
}: SessionDetailIdealLapV2Props) {
  if (proFeaturesLocked) {
    return (
      <section className={PANEL}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant">
            Ideal Lap
          </span>
          <Link
            to="/v2/pricing"
            className="font-v2-body text-xs font-medium text-v2-primary transition-colors hover:text-v2-primary/80"
          >
            Unlock with Pro
          </Link>
        </div>
        <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
          Sector breakdown and ideal lap times are included with Apex Pro.
        </p>
      </section>
    );
  }

  return (
    <section className={PANEL}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant">
          Ideal Lap
        </span>
      </div>
      <div className="grid grid-cols-2 items-end gap-4 sm:grid-cols-4">
        {(
          [
            ["S1", sessionMinima.s1Ms],
            ["S2", sessionMinima.s2Ms],
            ["S3", sessionMinima.s3Ms],
            ["Time", idealLapMs],
          ] as const
        ).map(([label, ms]) => (
          <div key={label} className="text-right">
            <div className="font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant">
              {label}
            </div>
            <div className="mt-1 font-v2-headline text-lg font-bold tabular-nums text-v2-primary">
              {ms != null ? formatLapMs(ms) : "—"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
