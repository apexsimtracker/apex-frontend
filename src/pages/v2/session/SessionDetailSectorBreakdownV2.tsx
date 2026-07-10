import { Sparkles } from "lucide-react";
import { formatLapMs } from "@/lib/utils";
import type { SessionTimingMinima } from "@/lib/sessionLapDisplay";
import { DUMMY_IDEAL_LAP_MS, DUMMY_SECTORS_MS } from "./sessionDetailDummyData";

type SessionDetailSectorBreakdownV2Props = {
  sessionMinima: SessionTimingMinima;
  idealLapMs: number | null | undefined;
};

const CARD = "rounded-xl bg-v2-surface-container-low p-4 shadow-lg";

export default function SessionDetailSectorBreakdownV2({
  sessionMinima,
  idealLapMs,
}: SessionDetailSectorBreakdownV2Props) {
  const sectorS1 = sessionMinima.s1Ms ?? DUMMY_SECTORS_MS.s1;
  const sectorS2 = sessionMinima.s2Ms ?? DUMMY_SECTORS_MS.s2;
  const sectorS3 = sessionMinima.s3Ms ?? DUMMY_SECTORS_MS.s3;
  const idealMs =
    idealLapMs ??
    (sessionMinima.s1Ms != null &&
    sessionMinima.s2Ms != null &&
    sessionMinima.s3Ms != null
      ? sessionMinima.s1Ms + sessionMinima.s2Ms + sessionMinima.s3Ms
      : DUMMY_IDEAL_LAP_MS);

  return (
    <section className={CARD}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-v2-headline text-lg font-bold tracking-tight text-v2-on-surface">
          Sector breakdown
        </h2>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-4">
        {(
          [
            ["Sector 1", sectorS1],
            ["Sector 2", sectorS2],
            ["Sector 3", sectorS3],
          ] as const
        ).map(([label, ms]) => (
          <div key={label} className="space-y-1.5">
            <div className="h-1 overflow-hidden rounded-full bg-v2-surface-container-highest">
              <div className="size-full bg-green-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-v2-body text-[10px] font-bold uppercase text-v2-on-surface-variant">
                {label}
              </span>
              <span className="font-v2-headline text-xl font-bold text-green-500">
                {formatLapMs(ms)}
              </span>
              <span className="mt-1 font-v2-body text-[9px] font-medium uppercase text-v2-on-surface-variant/60">
                Gap to best +0.00s
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-v2-outline-variant/10 pt-3">
        <div className="flex items-center gap-2">
          <Sparkles
            className="size-4"
            style={{ color: "#A855F7" }}
            aria-hidden
          />
          <span className="mr-2 font-v2-body text-xs font-bold uppercase tracking-tight text-v2-on-surface-variant">
            Ideal lap time:
          </span>
          <span
            className="font-v2-headline text-lg font-bold"
            style={{ color: "#A855F7" }}
          >
            {formatLapMs(idealMs)}
          </span>
        </div>
      </div>
    </section>
  );
}
