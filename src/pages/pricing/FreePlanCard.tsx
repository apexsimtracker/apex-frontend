import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AUTH_PATHS } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { appOutlineButtonClassName } from "@/components/app-ui/appButtonClasses";
import { PlanFeatureList } from "./PlanFeatureList";

type FreePlanCardProps = {
  name: string;
  priceLabel: string;
  features: string[];
  isLoggedIn: boolean;
  isPro: boolean;
  className?: string;
};

export function FreePlanCard({
  name,
  priceLabel,
  features,
  isLoggedIn,
  isPro,
  className,
}: FreePlanCardProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-low p-6 sm:p-7",
        className,
      )}
    >
      <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface">
        {name}
      </h2>
      <p className="mt-1 font-apex-headline text-3xl font-bold tracking-tight text-apex-on-surface">
        {priceLabel}
      </p>
      <PlanFeatureList features={features} variant="free" />
      <div className="mt-auto pt-8">
        {!isLoggedIn ? (
          <Button
            asChild
            variant="outline"
            className={cn("w-full", appOutlineButtonClassName)}
          >
            <Link to={AUTH_PATHS.signup}>Get started free</Link>
          </Button>
        ) : !isPro ? (
          <p className="rounded-apex-sm border border-apex-outline-variant/15 bg-apex-surface-container py-2.5 text-center font-apex-body text-sm font-medium text-apex-on-surface-variant">
            Current plan
          </p>
        ) : null}
      </div>
    </div>
  );
}
