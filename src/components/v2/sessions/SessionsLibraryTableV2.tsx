import SessionTypeTag from "@/components/SessionTypeTag";
import SimBadge from "@/components/SimBadge";
import { ProfilePositionBadgeV2 } from "@/components/v2/profile/ProfilePositionBadgeV2";
import { formatLapMs, formatCarName, formatTrackName } from "@/lib/utils";
import { getSimShortName } from "@/lib/sim";
import type { SessionsLibraryRow } from "@/lib/api";

function formatSessionDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ingestLabel(row: SessionsLibraryRow): string {
  const ingest = (row.ingestSource ?? "").toLowerCase();
  if (ingest === "manual_form" || row.source === "manual") return "Manual";
  if (ingest === "agent_upload" || row.source === "agent") return "Agent";
  if (ingest === "manual_upload_ibt") return "IBT";
  if (ingest === "manual_upload_json") return "JSON";
  return "Telemetry";
}

type SessionsLibraryTableV2Props = {
  items: SessionsLibraryRow[];
  loading: boolean;
  emptyMessage: string;
  onOpenSession: (sessionId: string) => void;
};

export default function SessionsLibraryTableV2({
  items,
  loading,
  emptyMessage,
  onOpenSession,
}: SessionsLibraryTableV2Props) {
  const thClass =
    "py-2 text-[10px] font-bold uppercase tracking-wider text-v2-on-surface-variant";

  return (
    <section className="space-y-3">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-v2-outline-variant/15">
              <th className={thClass}>Track</th>
              <th className={thClass}>Sim</th>
              <th className={thClass}>Kind</th>
              <th className={thClass}>Upload</th>
              <th className={thClass}>Car</th>
              <th className={thClass}>Pos</th>
              <th className={thClass}>Laps</th>
              <th className={`${thClass} text-right`}>Best Lap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-v2-outline-variant/5">
            {loading && items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-10 text-center font-v2-body text-sm text-v2-on-surface-variant"
                >
                  Loading sessions…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-10 text-center font-v2-body text-sm text-v2-on-surface-variant"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onOpenSession(row.id)}
                  className="cursor-pointer transition-colors hover:bg-v2-surface-container-low/50"
                >
                  <td className="whitespace-nowrap py-4 align-middle">
                    <div className="flex flex-col justify-center">
                      <span className="font-v2-body text-xs font-bold text-v2-on-surface">
                        {formatTrackName(row.trackName ?? row.track)}
                      </span>
                      <span className="font-v2-body text-[9px] text-v2-on-surface-variant">
                        {formatSessionDate(row.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <SimBadge sim={row.sim} size="sm" />
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <SessionTypeTag
                      sessionType={row.sessionType}
                      manualSessionKind={row.manualSessionKind}
                    />
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <span className="font-v2-body text-xs text-v2-on-surface-variant">
                      {ingestLabel(row)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <span className="font-v2-body text-xs font-medium text-v2-on-surface">
                      {formatCarName(row.carName ?? row.car ?? "")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <ProfilePositionBadgeV2 position={row.position} />
                  </td>
                  <td className="whitespace-nowrap py-4 align-middle">
                    <span className="font-v2-body text-xs text-v2-on-surface">
                      {row.lapCount}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-4 text-right align-middle">
                    <span className="font-v2-body text-xs font-medium text-v2-on-surface">
                      {formatLapMs(row.bestLapMs)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {loading && items.length === 0 ? (
          <div className="py-10 text-center font-v2-body text-sm text-v2-on-surface-variant">
            Loading sessions…
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center font-v2-body text-sm text-v2-on-surface-variant">
            {emptyMessage}
          </div>
        ) : (
          items.map((row) => (
            <div
              key={row.id}
              onClick={() => onOpenSession(row.id)}
              className="cursor-pointer rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-4 transition-colors hover:bg-v2-surface-container"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-v2-body text-xs font-bold text-v2-on-surface">
                    {formatTrackName(row.trackName ?? row.track)}
                  </p>
                  <p className="font-v2-body text-[9px] text-v2-on-surface-variant">
                    {formatSessionDate(row.createdAt)}
                  </p>
                </div>
                <ProfilePositionBadgeV2 position={row.position} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
                    Sim
                  </p>
                  <p className="font-v2-body font-medium text-v2-on-surface">
                    {getSimShortName(row.sim)}
                  </p>
                </div>
                <div>
                  <p className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
                    Upload
                  </p>
                  <p className="font-v2-body font-medium text-v2-on-surface">
                    {ingestLabel(row)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-v2-body text-[10px] uppercase text-v2-on-surface-variant">
                    Best Lap
                  </p>
                  <p className="font-v2-body font-medium text-v2-on-surface">
                    {formatLapMs(row.bestLapMs)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <SessionTypeTag
                  sessionType={row.sessionType}
                  manualSessionKind={row.manualSessionKind}
                />
                <span className="font-v2-body text-[10px] text-v2-on-surface-variant">
                  {row.lapCount} laps
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
