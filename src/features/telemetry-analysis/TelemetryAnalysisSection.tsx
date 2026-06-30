import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { useIsProUser } from "@/contexts/AuthContext";
import { DrivingTracesChart } from "./DrivingTracesChart";
import { FuelAnalysisChart } from "./FuelAnalysisChart";
import { LapSelector } from "./LapSelector";
import { TyreAnalysisChart } from "./TyreAnalysisChart";
import { isManualIngest } from "./telemetryEligibility";
import { useTelemetrySummary, useTelemetryTraces } from "./useSessionTelemetry";

type TabId = "driving" | "fuel" | "tyres";

type TelemetryAnalysisSectionProps = {
  sessionId: string;
  ingestPath?: string | null;
};

export function TelemetryAnalysisSection({
  sessionId,
  ingestPath,
}: TelemetryAnalysisSectionProps) {
  const isPro = useIsProUser();
  const manualIngest = isManualIngest(ingestPath);

  const {
    data: summary,
    isLoading,
    isError,
  } = useTelemetrySummary(sessionId, isPro && !manualIngest);

  const [tab, setTab] = useState<TabId>("driving");
  const [selectedLap, setSelectedLap] = useState<number | null>(null);
  const [compareLap, setCompareLap] = useState<number | null>(null);

  useEffect(() => {
    if (summary?.defaultLapNumber != null) {
      setSelectedLap(summary.defaultLapNumber);
    }
  }, [summary?.defaultLapNumber]);

  const canLoadTraces = Boolean(
    isPro &&
    summary?.eligible &&
    summary.hasProAccess &&
    selectedLap != null &&
    summary.laps.some((l) => l.lapNumber === selectedLap && l.hasTraces),
  );

  const { data: traces, isLoading: tracesLoading } = useTelemetryTraces(
    sessionId,
    selectedLap,
    compareLap,
    canLoadTraces && tab === "driving",
  );

  const hasFuel = (summary?.fuel?.perLap.length ?? 0) > 0;
  const hasTyres = (summary?.tyres?.perLap.length ?? 0) > 0;
  const hasAnyData = useMemo(
    () =>
      Boolean(
        summary?.laps.some((l) => l.hasTraces || l.hasFuel || l.hasTyres),
      ),
    [summary?.laps],
  );

  if (!isPro) {
    return (
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-8 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
        </div>
        <div className="relative">
          <div className="text-xs uppercase tracking-wider text-white/50">
            Telemetry Analysis
          </div>
          <p className="mt-2 text-lg font-semibold text-white">
            Telemetry Analysis is available with Apex Pro
          </p>
          <p className="mt-1 text-sm text-white/60">
            Unlock driving traces, fuel strategy, and tyre insights for
            agent-uploaded sessions
          </p>
          <Button
            asChild
            className="mt-5 bg-amber-500 text-black hover:bg-amber-400"
          >
            <Link to="/pricing">Upgrade to Pro</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (manualIngest) {
    return (
      <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-8 text-center">
        <div className="text-xs uppercase tracking-wider text-white/50">
          Telemetry Analysis
        </div>
        <p className="mt-2 text-lg font-semibold text-white">
          Upload with the Apex Agent for full telemetry analysis
        </p>
        <p className="mt-1 text-sm text-white/60">
          Manual and web uploads store lap times only. Install the desktop agent
          to capture driving traces, fuel, and tyre data automatically.
        </p>
        <Button
          asChild
          variant="outline"
          className="mt-5 border-white/15 text-white"
        >
          <Link to="/agent">Get Apex Agent</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-6 text-center">
        <div className="text-xs uppercase tracking-wider text-white/50">
          Telemetry Analysis
        </div>
        <p className="mt-2 text-sm text-white/60">
          Unable to load telemetry for this session.
        </p>
      </div>
    );
  }

  if (!summary.eligible) {
    return (
      <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-6 text-center">
        <div className="text-xs uppercase tracking-wider text-white/50">
          Telemetry Analysis
        </div>
        <p className="mt-2 text-sm text-white/60">
          Telemetry analysis is not available for this session.
        </p>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <div className="text-xs uppercase tracking-wider text-white/50">
          Telemetry Analysis
        </div>
        <p className="mt-1 text-sm text-white/60">
          Agent session · {summary.simKey.replace(/_/g, " ")}
        </p>
        <p className="mt-4 text-sm text-white/60">
          Lap times are stored, but driving traces, fuel, and tyre data were not
          captured for this session. Re-upload via a current Apex Agent build
          after driving at least one complete lap.
        </p>
        {summary.laps.length > 0 && (
          <div className="mt-6">
            <LapSelector
              laps={summary.laps}
              selectedLap={selectedLap}
              compareLap={compareLap}
              onSelectLap={setSelectedLap}
              onSelectCompare={setCompareLap}
            />
          </div>
        )}
      </div>
    );
  }

  const tabs: { id: TabId; label: string; enabled: boolean }[] = [
    {
      id: "driving",
      label: "Driving",
      enabled: summary.laps.some((l) => l.hasTraces),
    },
    { id: "fuel", label: "Fuel", enabled: hasFuel },
    { id: "tyres", label: "Tyres", enabled: hasTyres },
  ];

  const activeTab = tabs.find((t) => t.id === tab && t.enabled)
    ? tab
    : (tabs.find((t) => t.enabled)?.id ?? "driving");

  return (
    <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50">
            Telemetry Analysis
          </div>
          <p className="mt-1 text-sm text-white/60">
            Agent session · {summary.simKey.replace(/_/g, " ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs
            .filter((t) => t.enabled)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === t.id
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
        </div>
      </div>

      {activeTab === "driving" && (
        <div className="mt-6 space-y-6">
          <LapSelector
            laps={summary.laps}
            selectedLap={selectedLap}
            compareLap={compareLap}
            onSelectLap={setSelectedLap}
            onSelectCompare={setCompareLap}
          />
          {tracesLoading ? (
            <SkeletonBlock className="h-64 w-full" />
          ) : traces ? (
            <DrivingTracesChart traces={traces} compareLapNumber={compareLap} />
          ) : (
            <p className="text-sm text-white/60">
              No driving trace data for the selected lap.
            </p>
          )}
        </div>
      )}

      {activeTab === "fuel" && summary.fuel && (
        <FuelAnalysisChart fuel={summary.fuel} />
      )}

      {activeTab === "tyres" && summary.tyres && (
        <TyreAnalysisChart tyres={summary.tyres} />
      )}
    </div>
  );
}
