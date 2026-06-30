import { useEffect, useState } from "react";
import { ApexLogoImage } from "@/components/ApexLogo";
import {
  LOADING_EXTENDED_DELAY_MS,
  LOADING_LOGO_HEIGHT_PX,
  LOADING_ROTATE_MS,
  LOADING_STATUS_LINES,
  LOADING_TIPS,
  pickRandomIndex,
} from "@/lib/loadingTips";
import { cn } from "@/lib/utils";

function useLoadingExtendedContent() {
  const [startedAt] = useState(() => Date.now());

  const [extendedVisible, setExtendedVisible] = useState(
    () => Date.now() - startedAt >= LOADING_EXTENDED_DELAY_MS,
  );
  const [tipIndex, setTipIndex] = useState(() =>
    pickRandomIndex(LOADING_TIPS.length),
  );
  const [statusIndex, setStatusIndex] = useState(() =>
    pickRandomIndex(LOADING_STATUS_LINES.length),
  );

  useEffect(() => {
    if (extendedVisible) return;
    const remaining = Math.max(
      0,
      LOADING_EXTENDED_DELAY_MS - (Date.now() - startedAt),
    );
    const timeoutId = window.setTimeout(
      () => setExtendedVisible(true),
      remaining,
    );
    return () => window.clearTimeout(timeoutId);
  }, [extendedVisible, startedAt]);

  useEffect(() => {
    if (!extendedVisible) return;
    const intervalId = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
      setStatusIndex((prev) => (prev + 1) % LOADING_STATUS_LINES.length);
    }, LOADING_ROTATE_MS);
    return () => window.clearInterval(intervalId);
  }, [extendedVisible]);

  const statusLine =
    LOADING_STATUS_LINES[statusIndex] ?? LOADING_STATUS_LINES[0];
  const tip = LOADING_TIPS[tipIndex] ?? LOADING_TIPS[0];

  return { extendedVisible, statusLine, tip, tipIndex };
}

type AppLoadingScreenProps = {
  /** Full viewport overlay (auth, profile) vs in-main inline (lazy routes). */
  variant?: "splash" | "inline";
};

function LoadingGlowBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute left-0 top-0 h-[min(42vw,18rem)] w-[min(40vw,17rem)] -translate-x-1/4 translate-y-1/3 rounded-full opacity-[0.28] blur-[64px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(234, 88, 12, 0.22) 0%, rgba(220, 38, 38, 0.12) 58%, transparent 75%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-0 h-[min(42vw,18rem)] w-[min(40vw,17rem)] translate-x-1/4 translate-y-1/3 rounded-full opacity-[0.28] blur-[64px]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(234, 88, 12, 0.22) 0%, rgba(220, 38, 38, 0.12) 58%, transparent 75%)",
        }}
        aria-hidden
      />
    </>
  );
}

function LoadingProgressBar() {
  return (
    <div
      className="h-1 w-48 overflow-hidden rounded-full bg-white/10"
      aria-hidden
    >
      <div className="loading-shimmer-bar h-full w-1/3 rounded-full bg-gradient-to-r from-[rgb(240,28,28)]/80 to-[rgb(240,28,28)]" />
    </div>
  );
}

function LoadingScreenContent() {
  const { extendedVisible, statusLine, tip, tipIndex } =
    useLoadingExtendedContent();

  return (
    <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6">
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ height: LOADING_LOGO_HEIGHT_PX }}
      >
        <div
          className="pointer-events-none absolute inset-0 -m-4 rounded-full bg-[rgb(240,28,28)]/10 blur-xl"
          aria-hidden
        />
        <ApexLogoImage fixedDisplaySize className="relative" />
      </div>

      {extendedVisible && (
        <p className="mt-8 text-sm font-medium text-white/70">{statusLine}</p>
      )}

      <div className="mt-8">
        <LoadingProgressBar />
      </div>

      {extendedVisible && (
        <div
          key={tipIndex}
          className="mt-10 w-full rounded-xl border border-white/10 bg-card/50 p-5 backdrop-blur-lg"
          aria-hidden
        >
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">
            Tip
          </p>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-white/70">
            {tip}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AppLoadingScreen({
  variant = "splash",
}: AppLoadingScreenProps) {
  const isSplash = variant === "splash";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden bg-background",
        isSplash
          ? "fixed inset-0 z-[200] min-h-screen"
          : "flex min-h-[40vh] flex-1 py-16",
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading application</span>
      <LoadingGlowBackground />
      <LoadingScreenContent />
    </div>
  );
}
