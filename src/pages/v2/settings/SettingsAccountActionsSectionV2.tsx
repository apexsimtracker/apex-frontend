import { ChevronDown, Download, Loader2, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataExportFormat } from "@/lib/api";
import { SettingsSectionChromeV2 } from "./SettingsSectionChromeV2";
import {
  v2DangerCardClassName,
  v2OutlineButtonClassName,
  v2TertiaryIconClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";

type SettingsAccountActionsSectionV2Props = {
  exportFormat: DataExportFormat;
  onExportFormatChange: (format: DataExportFormat) => void;
  exportLoading: boolean;
  onExportData: () => void | Promise<void>;
  onLogout: () => void | Promise<void>;
  onDeleteAccount: () => void;
};

export default function SettingsAccountActionsSectionV2({
  exportFormat,
  onExportFormatChange,
  exportLoading,
  onExportData,
  onLogout,
  onDeleteAccount,
}: SettingsAccountActionsSectionV2Props) {
  return (
    <SettingsSectionChromeV2 title="Account actions" bare>
      <div className="space-y-4">
        <div className="rounded-v2-lg bg-v2-surface-container-low p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-v2-headline text-sm font-bold text-v2-on-surface">
              Export data
            </h3>
            <Download
              className={cn("size-5", v2TertiaryIconClassName)}
              aria-hidden
            />
          </div>
          <div className="relative">
            <select
              id="v2-export-format"
              value={exportFormat}
              onChange={(e) =>
                onExportFormatChange(e.target.value as DataExportFormat)
              }
              disabled={exportLoading}
              className="w-full appearance-none rounded-v2-sm border border-transparent bg-v2-surface-container-highest px-4 py-3 font-v2-body text-sm text-v2-on-surface shadow-none focus:border-v2-primary focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
            >
              <option value="xlsx">Excel workbook (.xlsx) — full data</option>
              <option value="pdf">
                Summary PDF (.pdf) — printable overview
              </option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-v2-on-surface-variant"
              aria-hidden
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "mt-4 w-full",
              v2OutlineButtonClassName,
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
                  className={cn("mr-2 size-4", v2TertiaryIconClassName)}
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
          className="group flex w-full items-center justify-between rounded-v2-lg bg-v2-surface-container-low p-6 transition-colors hover:bg-v2-surface-container"
        >
          <span className="font-v2-headline text-sm font-bold text-v2-on-surface">
            Log out
          </span>
          <LogOut
            className="size-5 text-v2-on-surface-variant transition-colors group-hover:text-v2-on-surface"
            aria-hidden
          />
        </button>

        <button
          type="button"
          onClick={onDeleteAccount}
          className={cn(
            "group flex w-full items-center justify-between",
            v2DangerCardClassName,
          )}
        >
          <div className="text-left">
            <span className="block font-v2-headline text-sm font-bold text-[#ff6e84]">
              Delete account
            </span>
            <span className="mt-1 block text-[10px] font-medium uppercase tracking-tighter text-[#ff6e84]/60">
              This action is permanent and irreversible
            </span>
          </div>
          <Trash2 className="size-5 text-[#ff6e84]" aria-hidden />
        </button>
      </div>
    </SettingsSectionChromeV2>
  );
}
