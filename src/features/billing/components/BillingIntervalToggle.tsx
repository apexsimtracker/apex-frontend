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
  return (
    <div
      className="inline-flex w-full rounded-lg border border-white/10 bg-muted/40 p-1"
      role="group"
      aria-label="Billing interval"
    >
      <button
        type="button"
        data-testid="billing-interval-monthly"
        disabled={disabled || !monthlyAvailable}
        aria-pressed={interval === "MONTHLY"}
        onClick={() => onIntervalChange("MONTHLY")}
        className={cn(
          "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          interval === "MONTHLY"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          (!monthlyAvailable || disabled) && "cursor-not-allowed opacity-50"
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        data-testid="billing-interval-annual"
        disabled={disabled || !annualAvailable}
        aria-pressed={interval === "ANNUAL"}
        onClick={() => onIntervalChange("ANNUAL")}
        className={cn(
          "relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          interval === "ANNUAL"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          (!annualAvailable || disabled) && "cursor-not-allowed opacity-50"
        )}
      >
        Annual
        {annualSavingsPercent != null && annualSavingsPercent > 0 && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: BRAND_RED }}
          >
            Save {annualSavingsPercent}%
          </span>
        )}
      </button>
    </div>
  );
}
