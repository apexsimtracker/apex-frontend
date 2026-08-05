import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { formatLapMs } from "@/lib/utils";
import type { SessionTimingMinima } from "@/lib/sessionLapDisplay";

type SessionDetailSectorBreakdownProps = {
  sessionMinima: SessionTimingMinima;
  idealLapMs: number | null | undefined;
  proFeaturesLocked?: boolean;
};

const CARD = "rounded-xl bg-apex-surface-container-low p-4 shadow-lg";

function formatSectorOrDash(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  return formatLapMs(ms);
}

function SectorBreakdownBody({
  sessionMinima,
  idealLapMs,
}: {
  sessionMinima: SessionTimingMinima;
  idealLapMs: number | null | undefined;
}) {
  const sectorS1 = sessionMinima.s1Ms ?? null;
  const sectorS2 = sessionMinima.s2Ms ?? null;
  const sectorS3 = sessionMinima.s3Ms ?? null;
  const idealMs =
    idealLapMs != null && Number.isFinite(idealLapMs)
      ? idealLapMs
      : sectorS1 != null && sectorS2 != null && sectorS3 != null
        ? sectorS1 + sectorS2 + sectorS3
        : null;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-apex-headline text-lg font-bold tracking-tight text-apex-on-surface">
          Sector breakdown
        </h2>
        <span className="font-apex-body text-[10px] font-bold uppercase tracking-widest text-apex-on-surface-variant">
          Session bests
        </span>
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
            <div className="h-1 overflow-hidden rounded-full bg-apex-surface-container-highest">
              <div
                className={`size-full ${ms != null ? "bg-purple-400" : "bg-transparent"}`}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-apex-body text-[10px] font-bold uppercase text-apex-on-surface-variant">
                {label}
              </span>
              <span
                className={`font-apex-headline text-xl font-bold ${
                  ms != null ? "text-purple-400" : "text-apex-on-surface-variant"
                }`}
              >
                {formatSectorOrDash(ms)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-apex-outline-variant/10 pt-3">
        <div className="flex items-center gap-2">
          <Sparkles
            className="size-4"
            style={{ color: "#A855F7" }}
            aria-hidden
          />
          <span className="mr-2 font-apex-body text-xs font-bold uppercase tracking-tight text-apex-on-surface-variant">
            Ideal lap time:
          </span>
          <span
            className="font-apex-headline text-lg font-bold"
            style={{ color: idealMs != null ? "#A855F7" : undefined }}
          >
            {formatSectorOrDash(idealMs)}
          </span>
        </div>
      </div>
    </>
  );
}

/** Placeholder minima so the locked card keeps layout while blurred. */
const LOCKED_PREVIEW_MINIMA: SessionTimingMinima = {
  lapMs: 92_500,
  s1Ms: 28_400,
  s2Ms: 31_200,
  s3Ms: 32_900,
};

export default function SessionDetailSectorBreakdown({
  sessionMinima,
  idealLapMs,
  proFeaturesLocked = false,
}: SessionDetailSectorBreakdownProps) {
  if (proFeaturesLocked) {
    return (
      <section className={`${CARD} relative overflow-hidden`}>
        <div
          className="select-none blur-sm pointer-events-none"
          aria-hidden
        >
          <SectorBreakdownBody
            sessionMinima={LOCKED_PREVIEW_MINIMA}
            idealLapMs={92_500}
          />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-apex-surface-container-low/55 px-4 text-center backdrop-blur-[2px]">
          <p className="font-apex-headline text-sm font-bold text-apex-on-surface">
            Sector breakdown is a Pro feature
          </p>
          <p className="max-w-sm font-apex-body text-xs text-apex-on-surface-variant">
            Unlock ideal lap sectors and session bests with Apex Pro.
          </p>
          <Link
            to="/pricing"
            className="mt-1 inline-flex rounded-apex-sm bg-apex-primary px-3 py-1.5 font-apex-body text-[11px] font-bold uppercase tracking-wider text-apex-on-primary transition-opacity hover:opacity-90"
          >
            Upgrade to Pro
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={CARD}>
      <SectorBreakdownBody
        sessionMinima={sessionMinima}
        idealLapMs={idealLapMs}
      />
    </section>
  );
}
