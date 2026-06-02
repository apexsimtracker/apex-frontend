import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_RED } from "@/lib/appConfig";
import { cn } from "@/lib/utils";

const PRO_BORDER_STYLE = {
  borderColor: "color-mix(in srgb, rgb(240, 28, 28) 35%, transparent)",
} as const;

type ProUpgradeCalloutProps = {
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  layout?: "banner" | "card";
  className?: string;
};

export function ProUpgradeCallout({
  description,
  ctaLabel = "View Pro plans",
  ctaHref = "/pricing",
  layout = "banner",
  className,
}: ProUpgradeCalloutProps) {
  const ctaButton = (
    <Button
      asChild
      size={layout === "banner" ? "sm" : "default"}
      className={cn(
        "shrink-0 text-white hover:opacity-90",
        layout === "card" && "mt-6"
      )}
      style={{ backgroundColor: BRAND_RED }}
    >
      <Link to={ctaHref}>
        <Sparkles className="mr-2 size-4" aria-hidden />
        {ctaLabel}
      </Link>
    </Button>
  );

  if (layout === "card") {
    return (
      <div
        className={cn(
          "rounded-xl border bg-card/50 p-8 text-center sm:p-10",
          className
        )}
        style={PRO_BORDER_STYLE}
      >
        <p className="text-sm text-muted-foreground sm:text-base">{description}</p>
        {ctaButton}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4",
        className
      )}
      style={PRO_BORDER_STYLE}
    >
      <p className="text-sm text-muted-foreground">{description}</p>
      {ctaButton}
    </div>
  );
}
