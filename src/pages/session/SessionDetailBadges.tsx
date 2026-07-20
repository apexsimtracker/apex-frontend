import { CloudRain, Droplets, PenLine, Sun } from "lucide-react";
import SimBadge from "@/components/SimBadge";
import SessionTypeTag from "@/components/SessionTypeTag";
import type { SessionDetail } from "@/features/session-detail/sessionDetailData";
import { telemetryIngestSourceLabel } from "@/features/telemetry-analysis/telemetryEligibility";

type ResolvedSessionFields = {
  sim: string | null;
};

type SessionDetailBadgesProps = {
  session: SessionDetail;
  resolved: ResolvedSessionFields;
  isManual: boolean;
};

const CONDITIONS_LABEL: Record<
  NonNullable<SessionDetail["conditions"]>,
  { label: string; Icon: typeof Sun }
> = {
  DRY: { label: "Dry", Icon: Sun },
  WET: { label: "Wet", Icon: CloudRain },
  MIXED: { label: "Mixed", Icon: Droplets },
};

export default function SessionDetailBadges({
  session,
  resolved,
  isManual,
}: SessionDetailBadgesProps) {
  const conditionsMeta = session.conditions
    ? CONDITIONS_LABEL[session.conditions]
    : null;
  const ConditionsIcon = conditionsMeta?.Icon;
  const ingestLabel = session.ingestPath
    ? telemetryIngestSourceLabel(session.ingestPath)
    : null;
  const weather = session.weather ?? null;
  const weatherBits: string[] = [];
  if (weather?.airTempC != null && Number.isFinite(weather.airTempC)) {
    weatherBits.push(`Air ${Math.round(weather.airTempC)}°C`);
  }
  if (weather?.trackTempC != null && Number.isFinite(weather.trackTempC)) {
    weatherBits.push(`Track ${Math.round(weather.trackTempC)}°C`);
  }
  if (weather?.humidityPct != null && Number.isFinite(weather.humidityPct)) {
    weatherBits.push(`RH ${Math.round(weather.humidityPct)}%`);
  }
  if (weather?.skies?.trim()) {
    weatherBits.push(weather.skies.trim());
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SessionTypeTag
        sessionType={session.sessionType}
        manualSessionKind={session.manualSessionKind}
        size="md"
      />
      <SimBadge sim={resolved.sim ?? session.sim} />
      {isManual && (
        <span className="inline-flex items-center gap-1 rounded-apex-sm border border-apex-outline-variant/20 bg-apex-surface-container-high px-1.5 py-0.5 font-apex-body text-[10px] font-medium tracking-wide text-apex-on-surface-variant">
          <PenLine className="size-3" aria-hidden />
          Manual
        </span>
      )}
      {ingestLabel && !isManual && (
        <span className="inline-flex items-center rounded-apex-sm border border-apex-outline-variant/20 bg-apex-surface-container-high px-1.5 py-0.5 font-apex-body text-[10px] font-medium tracking-wide text-apex-on-surface-variant">
          {ingestLabel}
        </span>
      )}
      {conditionsMeta && ConditionsIcon && (
        <span className="inline-flex items-center gap-1 rounded-apex-sm border border-apex-outline-variant/20 bg-apex-surface-container-high px-1.5 py-0.5 font-apex-body text-[10px] font-medium tracking-wide text-apex-on-surface-variant">
          <ConditionsIcon className="size-3" aria-hidden />
          {conditionsMeta.label}
        </span>
      )}
      {weatherBits.map((bit) => (
        <span
          key={bit}
          className="inline-flex items-center rounded-apex-sm border border-apex-outline-variant/20 bg-apex-surface-container-high px-1.5 py-0.5 font-apex-body text-[10px] font-medium tracking-wide text-apex-on-surface-variant"
        >
          {bit}
        </span>
      ))}
    </div>
  );
}
