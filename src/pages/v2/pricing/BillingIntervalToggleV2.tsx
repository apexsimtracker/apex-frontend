import type { BillingInterval } from "@/lib/api/activityBilling";
import { cn } from "@/lib/utils";
import { BRAND_RED } from "@/lib/appConfig";

type BillingIntervalToggleV2Props = {
  interval: BillingInterval;
  onIntervalChange: (interval: BillingInterval) => void;
  monthlyAvailable: boolean;
  annualAvailable: boolean;
  annualSavingsPercent: number | null;
  disabled?: boolean;
};

export function BillingIntervalToggleV2({
  interval,
  onIntervalChange,
  monthlyAvailable,
  annualAvailable,
  annualSavingsPercent,
  disabled = false,
}: BillingIntervalToggleV2Props) {
  const monthlyActive = interval === "MONTHLY";
  const annualActive = interval === "ANNUAL";

  return (
    <div
      className="inline-flex w-full rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-1"
      role="group"
      aria-label="Billing interval"
    >
      <button
        type="button"
        data-testid="billing-interval-monthly"
        disabled={disabled || !monthlyAvailable}
        aria-pressed={monthlyActive}
        onClick={() => onIntervalChange("MONTHLY")}
        style={monthlyActive ? { backgroundColor: BRAND_RED } : undefined}
        className={cn(
          "flex flex-1 items-center justify-center rounded-md p-2 font-v2-headline text-xs transition-colors sm:px-3 sm:text-sm",
          monthlyActive
            ? "font-bold text-white shadow-sm"
            : "font-medium text-v2-on-surface-variant hover:text-v2-on-surface",
          (!monthlyAvailable || disabled) && "cursor-not-allowed opacity-50",
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        data-testid="billing-interval-annual"
        disabled={disabled || !annualAvailable}
        aria-pressed={annualActive}
        onClick={() => onIntervalChange("ANNUAL")}
        style={annualActive ? { backgroundColor: BRAND_RED } : undefined}
        className={cn(
          "relative flex flex-1 items-center justify-center gap-1.5 rounded-md p-2 font-v2-headline text-xs transition-colors sm:px-3 sm:text-sm",
          annualActive
            ? "font-bold text-white shadow-sm"
            : "font-medium text-v2-on-surface-variant hover:text-v2-on-surface",
          (!annualAvailable || disabled) && "cursor-not-allowed opacity-50",
        )}
      >
        Annual
        {annualSavingsPercent != null && annualSavingsPercent > 0 && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 font-v2-body text-[10px] font-semibold uppercase tracking-wide",
              annualActive ? "bg-white/20 text-white" : "text-white",
            )}
            style={annualActive ? undefined : { backgroundColor: BRAND_RED }}
          >
            Save {annualSavingsPercent}%
          </span>
        )}
      </button>
    </div>
  );
}
