import { planTierLabel, type PlanTier } from "@/features/billing/planPill";
import { cn } from "@/lib/utils";

const TIER_CLASS_NAMES: Record<PlanTier, string> = {
  PRO: "bg-[#E10600] text-white",
  BETA: "border border-[#8ff5ff]/40 bg-[#8ff5ff]/10 text-[#8ff5ff]",
  FREE: "bg-apex-surface-container-highest text-apex-on-surface-variant",
};

export type PlanPillProps = {
  tier: PlanTier;
  className?: string;
};

export default function PlanPill({ tier, className }: PlanPillProps) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-apex-sm px-1.5 py-0.5 font-apex-headline text-[10px] font-bold uppercase tracking-wider",
        TIER_CLASS_NAMES[tier],
        className,
      )}
    >
      {planTierLabel(tier)}
    </span>
  );
}
