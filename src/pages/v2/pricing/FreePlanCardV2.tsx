import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { v2OutlineButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { PlanFeatureListV2 } from "./PlanFeatureListV2";

type FreePlanCardV2Props = {
  name: string;
  priceLabel: string;
  features: string[];
  isLoggedIn: boolean;
  isPro: boolean;
  className?: string;
};

export function FreePlanCardV2({
  name,
  priceLabel,
  features,
  isLoggedIn,
  isPro,
  className,
}: FreePlanCardV2Props) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-6 sm:p-7",
        className,
      )}
    >
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        {name}
      </h2>
      <p className="mt-1 font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
        {priceLabel}
      </p>
      <PlanFeatureListV2 features={features} variant="free" />
      <div className="mt-auto pt-8">
        {!isLoggedIn ? (
          <Button
            asChild
            variant="outline"
            className={cn("w-full", v2OutlineButtonClassName)}
          >
            <Link to="/signup">Get started free</Link>
          </Button>
        ) : !isPro ? (
          <p className="rounded-v2-sm border border-v2-outline-variant/15 bg-v2-surface-container py-2.5 text-center font-v2-body text-sm font-medium text-v2-on-surface-variant">
            Current plan
          </p>
        ) : null}
      </div>
    </div>
  );
}
