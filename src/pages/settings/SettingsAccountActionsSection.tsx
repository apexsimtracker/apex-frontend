import { ChevronDown, Download, Loader2, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataExportDepth, DataExportJob } from "@/lib/api";
import { SettingsSectionChrome } from "./SettingsSectionChrome";
import {
  appDangerCardClassName,
  appOutlineButtonClassName,
  appTertiaryIconClassName,
} from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";
import { formatRetryAfterMs } from "@/features/settings/utils";
import { useMemo } from "react";

type SettingsAccountActionsSectionProps = {
  exportDepth: DataExportDepth;
  onExportDepthChange: (depth: DataExportDepth) => void;
  exportJob: DataExportJob | null;
  exportRequesting: boolean;
  exportPolling: boolean;
  cooldownMs: number | null;
  onRequestExport: () => void | Promise<void>;
  onDownloadExport: () => void | Promise<void>;
  onLogout: () => void | Promise<void>;
  onDeleteAccount: () => void;
};

function expiresInLabel(expiresAt: string | undefined): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  return `Expires in ${formatRetryAfterMs(ms)}`;
}

export default function SettingsAccountActionsSection({
  exportDepth,
  onExportDepthChange,
  exportJob,
  exportRequesting,
  exportPolling,
  cooldownMs,
  onRequestExport,
  onDownloadExport,
  onLogout,
  onDeleteAccount,
}: SettingsAccountActionsSectionProps) {
  const status = exportJob?.status;
  const busy =
    exportRequesting ||
    exportPolling ||
    status === "pending" ||
    status === "processing";
  const ready = status === "ready" && !!exportJob?.downloadUrl;
  const failed = status === "failed";
  const onCooldown = cooldownMs != null && cooldownMs > 0 && !ready && !busy;

  const statusCopy = useMemo(() => {
    if (busy) return "Preparing your export…";
    if (ready) return expiresInLabel(exportJob?.expiresAt) ?? "Download ready";
    if (failed) {
      return (
        exportJob?.error?.message ??
        "Export failed. You can try again after the cooldown."
      );
    }
    if (status === "expired") {
      return "Your previous export expired. Request a new one when the cooldown ends.";
    }
    if (onCooldown && cooldownMs != null) {
      return `You can export again in ${formatRetryAfterMs(cooldownMs)}.`;
    }
    return "Creates a zip archive. Full exports include lap telemetry and take longer.";
  }, [busy, ready, failed, status, exportJob, onCooldown, cooldownMs]);

  return (
    <SettingsSectionChrome title="Account actions" bare>
      <div className="space-y-4">
        <div className="rounded-apex-lg bg-apex-surface-container-low p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-apex-headline text-sm font-bold text-apex-on-surface">
              Export data
            </h3>
            <Download
              className={cn("size-5", appTertiaryIconClassName)}
              aria-hidden
            />
          </div>
          <div className="relative">
            <select
              id="export-depth"
              value={exportDepth}
              onChange={(e) =>
                onExportDepthChange(e.target.value as DataExportDepth)
              }
              disabled={busy || onCooldown}
              className="w-full appearance-none rounded-apex-sm border border-transparent bg-apex-surface-container-highest px-4 py-3 font-apex-body text-sm text-apex-on-surface shadow-none focus:border-apex-primary focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
            >
              <option value="summary">Account summary — no telemetry</option>
              <option value="full">
                Full export — includes raw telemetry
              </option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-apex-on-surface-variant"
              aria-hidden
            />
          </div>
          <p className="mt-3 font-apex-body text-xs text-apex-on-surface-variant">
            {statusCopy}
          </p>
          {ready ? (
            <Button
              type="button"
              variant="outline"
              className={cn("mt-4 w-full", appOutlineButtonClassName)}
              onClick={() => void onDownloadExport()}
            >
              <Download
                className={cn("mr-2 size-4", appTertiaryIconClassName)}
                aria-hidden
              />
              Download ready
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className={cn(
                "mt-4 w-full",
                appOutlineButtonClassName,
                (busy || onCooldown) && "cursor-not-allowed opacity-60",
              )}
              onClick={() => void onRequestExport()}
              disabled={busy || onCooldown}
              aria-busy={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Processing…
                </>
              ) : (
                <>
                  <Download
                    className={cn("mr-2 size-4", appTertiaryIconClassName)}
                    aria-hidden
                  />
                  Request export
                </>
              )}
            </Button>
          )}
        </div>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="group flex w-full items-center justify-between rounded-apex-lg bg-apex-surface-container-low p-6 transition-colors hover:bg-apex-surface-container"
        >
          <span className="font-apex-headline text-sm font-bold text-apex-on-surface">
            Log out
          </span>
          <LogOut
            className="size-5 text-apex-on-surface-variant transition-colors group-hover:text-apex-on-surface"
            aria-hidden
          />
        </button>

        <button
          type="button"
          onClick={onDeleteAccount}
          className={cn(
            "group flex w-full items-center justify-between rounded-apex-lg p-6 transition-colors",
            appDangerCardClassName,
          )}
        >
          <span className="font-apex-headline text-sm font-bold text-apex-error">
            Delete account
          </span>
          <Trash2
            className="size-5 text-apex-error/70 transition-colors group-hover:text-apex-error"
            aria-hidden
          />
        </button>
      </div>
    </SettingsSectionChrome>
  );
}
