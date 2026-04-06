import { type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { ChartProGate, type ProFeature } from "@/components/ProGate";
import ChartPreviewTeaser from "@/components/ChartPreviewTeaser";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { type ChartState, type ChartPreviewData } from "@/hooks/useChartData";

interface ChartContainerProps {
  state: ChartState;
  feature: ProFeature;
  error?: string | null;
  preview?: ChartPreviewData | null;
  children: ReactNode;
  className?: string;
  minHeight?: string;
}

export default function ChartContainer({
  state,
  feature,
  error,
  preview,
  children,
  className = "",
  minHeight = "min-h-[300px]",
}: ChartContainerProps) {
  if (state === "loading") {
    return (
      <div
        className={`rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden ${minHeight} ${className}`}
      >
        <SkeletonBlock
          className="w-full min-h-[300px]"
          rounded="lg"
        />
      </div>
    );
  }

  if (state === "preview") {
    return (
      <ChartPreviewTeaser
        feature={feature}
        preview={preview ?? null}
        className={className}
        minHeight={minHeight}
      />
    );
  }

  if (state === "gated") {
    return <ChartProGate feature={feature} className={`${minHeight} ${className}`} />;
  }

  if (state === "error") {
    return (
      <div
        className={`rounded-lg border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center ${minHeight} ${className}`}
      >
        <AlertCircle className="h-8 w-8 text-red-400/60 mb-3" />
        <p className="text-sm text-white/60">{error ?? "Failed to load chart"}</p>
      </div>
    );
  }

  return <>{children}</>;
}
