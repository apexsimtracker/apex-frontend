import type { BillingInterval } from "@/lib/api/activityBilling";
import { cn } from "@/lib/utils";
import { BRAND_RED } from "@/lib/appConfig";

type BillingIntervalToggleProps = {
  interval: BillingInterval;
  onIntervalChange: (interval: BillingInterval) => void;
  monthlyAvailable: boolean;
  annualAvailable: boolean;
  annualSavingsPercent: number | null;
  disabled?: boolean;
};

export function BillingIntervalToggle({
  interval,
  onIntervalChange,
  monthlyAvailable,
  annualAvailable,
  annualSavingsPercent,
  disabled = false,
}: BillingIntervalToggleProps) {
  const monthlyActive = interval === "MONTHLY";
  const annualActive = interval === "ANNUAL";

  return (
    <div
      className="inline-flex w-full rounded-lg border border-apex-outline-variant/15 bg-apex-surface-container-low p-1"
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
          "flex flex-1 items-center justify-center rounded-md p-2 font-apex-headline text-xs transition-colors sm:px-3 sm:text-sm",
          monthlyActive
            ? "font-bold text-white shadow-sm"
            : "font-medium text-apex-on-surface-variant hover:text-apex-on-surface",
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
          "relative flex flex-1 items-center justify-center gap-1.5 rounded-md p-2 font-apex-headline text-xs transition-colors sm:px-3 sm:text-sm",
          annualActive
            ? "font-bold text-white shadow-sm"
            : "font-medium text-apex-on-surface-variant hover:text-apex-on-surface",
          (!annualAvailable || disabled) && "cursor-not-allowed opacity-50",
        )}
      >
        Annual
        {annualSavingsPercent != null && annualSavingsPercent > 0 && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 font-apex-body text-[10px] font-semibold uppercase tracking-wide",
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
