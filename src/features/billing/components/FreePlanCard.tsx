import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
        "flex h-full flex-col rounded-xl border border-white/10 bg-card/50 p-6 sm:p-7",
        className,
      )}
    >
      <h2 className="text-lg font-semibold text-foreground">{name}</h2>
      <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
        {priceLabel}
      </p>
      <PlanFeatureList features={features} variant="free" />
      <div className="mt-auto pt-8">
        {!isLoggedIn ? (
          <Button asChild variant="outline" className="w-full border-white/15">
            <Link to="/signup">Get started free</Link>
          </Button>
        ) : !isPro ? (
          <p className="rounded-lg border border-white/10 bg-muted/30 py-2.5 text-center text-sm font-medium text-muted-foreground">
            Current plan
          </p>
        ) : null}
      </div>
    </div>
  );
}
