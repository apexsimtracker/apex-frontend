import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLapMs } from "@/lib/utils";
import type { ChartPreviewData } from "@/hooks/useChartData";
import type { ProFeature } from "@/components/ProGate";

const CHART_TITLES: Partial<Record<ProFeature, string>> = {
  "lap-charts": "Lap Charts",
  "sector-charts": "Sector Charts",
  "delta-charts": "Delta Charts",
  "position-charts": "Position Charts",
};

interface ChartPreviewTeaserProps {
  feature: ProFeature;
  preview: ChartPreviewData | null;
  className?: string;
  minHeight?: string;
}

export default function ChartPreviewTeaser({
  feature,
  preview,
  className = "",
  minHeight = "min-h-[300px]",
}: ChartPreviewTeaserProps) {
  const navigate = useNavigate();
  const title = CHART_TITLES[feature] ?? "Charts";

  const previewText = preview
    ? [
        `${preview.lapsCount} lap${preview.lapsCount !== 1 ? "s" : ""}`,
        preview.bestLapMs ? `Best ${formatLapMs(preview.bestLapMs)}` : null,
        preview.avgLapMs ? `Avg ${formatLapMs(preview.avgLapMs)}` : null,
      ]
        .filter(Boolean)
        .join(" • ")
    : null;

  return (
    <div
      className={`rounded-lg border border-white/10 bg-white/[0.02] p-8 flex flex-col items-center justify-center text-center ${minHeight} ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
        <BarChart3 className="h-6 w-6 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-white">
        {title}{" "}
        <span className="text-amber-500">(Apex Pro)</span>
      </h3>
      {previewText && (
        <p className="mt-2 text-sm text-white/60">
          Preview: {previewText}
        </p>
      )}
      <Button
        onClick={() => navigate("/upgrade")}
        className="mt-6 bg-amber-500 text-black hover:bg-amber-400"
      >
        Upgrade
      </Button>
    </div>
  );
}
