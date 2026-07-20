import { ChevronDown, Download, Loader2, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataExportFormat } from "@/lib/api";
import { SettingsSectionChrome } from "./SettingsSectionChrome";
import {
  appDangerCardClassName,
  appOutlineButtonClassName,
  appTertiaryIconClassName,
} from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";

type SettingsAccountActionsSectionProps = {
  exportFormat: DataExportFormat;
  onExportFormatChange: (format: DataExportFormat) => void;
  exportLoading: boolean;
  onExportData: () => void | Promise<void>;
  onLogout: () => void | Promise<void>;
  onDeleteAccount: () => void;
};

export default function SettingsAccountActionsSection({
  exportFormat,
  onExportFormatChange,
  exportLoading,
  onExportData,
  onLogout,
  onDeleteAccount,
}: SettingsAccountActionsSectionProps) {
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
              id="export-format"
              value={exportFormat}
              onChange={(e) =>
                onExportFormatChange(e.target.value as DataExportFormat)
              }
              disabled={exportLoading}
              className="w-full appearance-none rounded-apex-sm border border-transparent bg-apex-surface-container-highest px-4 py-3 font-apex-body text-sm text-apex-on-surface shadow-none focus:border-apex-primary focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
            >
              <option value="xlsx">Excel workbook (.xlsx) — full data</option>
              <option value="pdf">
                Summary PDF (.pdf) — printable overview
              </option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-apex-on-surface-variant"
              aria-hidden
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "mt-4 w-full",
              appOutlineButtonClassName,
              exportLoading && "cursor-not-allowed opacity-60",
            )}
            onClick={() => void onExportData()}
            disabled={exportLoading}
            aria-busy={exportLoading}
          >
            {exportLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Exporting…
              </>
            ) : (
              <>
                <Download
                  className={cn("mr-2 size-4", appTertiaryIconClassName)}
                  aria-hidden
                />
                Export data
              </>
            )}
          </Button>
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
            "group flex w-full items-center justify-between",
            appDangerCardClassName,
          )}
        >
          <div className="text-left">
            <span className="block font-apex-headline text-sm font-bold text-[#ff6e84]">
              Delete account
            </span>
            <span className="mt-1 block text-[10px] font-medium uppercase tracking-tighter text-[#ff6e84]/60">
              This action is permanent and irreversible
            </span>
          </div>
          <Trash2 className="size-5 text-[#ff6e84]" aria-hidden />
        </button>
      </div>
    </SettingsSectionChrome>
  );
}
