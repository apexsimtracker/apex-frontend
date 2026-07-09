import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_RED } from "@/lib/appConfig";

type PlanFeatureListV2Props = {
  features: string[];
  variant: "free" | "pro";
  className?: string;
};

export function PlanFeatureListV2({
  features,
  variant,
  className,
}: PlanFeatureListV2Props) {
  return (
    <ul className={cn("mt-6 space-y-3", className)}>
      {features.map((feature) => (
        <li
          key={feature}
          className="flex gap-2 font-v2-body text-sm text-v2-on-surface-variant"
        >
          <Check
            className="mt-0.5 size-4 shrink-0"
            style={variant === "pro" ? { color: BRAND_RED } : undefined}
            aria-hidden
          />
          <span
            className={variant === "pro" ? "text-v2-on-surface" : undefined}
          >
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}
