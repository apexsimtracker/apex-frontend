import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_RED } from "@/lib/appConfig";

type PlanFeatureListProps = {
  features: string[];
  variant: "free" | "pro";
  className?: string;
};

export function PlanFeatureList({
  features,
  variant,
  className,
}: PlanFeatureListProps) {
  return (
    <ul className={cn("mt-6 space-y-3", className)}>
      {features.map((feature) => (
        <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
          <Check
            className="mt-0.5 size-4 shrink-0"
            style={variant === "pro" ? { color: BRAND_RED } : undefined}
            aria-hidden
          />
          <span
            className={variant === "pro" ? "text-foreground/90" : undefined}
          >
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}
