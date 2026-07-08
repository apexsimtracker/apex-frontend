import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type AgentProUpgradeCardV2Props = {
  onUpgradeClick: () => void;
  className?: string;
};

export default function AgentProUpgradeCardV2({
  onUpgradeClick,
  className,
}: AgentProUpgradeCardV2Props) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[#2a2a2a] bg-gradient-to-b from-v2-surface-container to-v2-background p-6 text-center",
        className,
      )}
      data-purpose="upgrade-card"
    >
      <div className="mb-4 flex justify-center">
        <div className="rounded-full bg-v2-primary/10 p-3">
          <Lock className="size-6 text-v2-primary" aria-hidden />
        </div>
      </div>
      <h3 className="font-v2-headline text-xl font-bold text-v2-on-surface">
        Apex Pro Required
      </h3>
      <p className="mb-6 mt-2 text-sm text-v2-on-surface-variant">
        Automatic uploads are available with Apex Pro.
      </p>
      <button
        type="button"
        onClick={onUpgradeClick}
        className="w-full rounded-lg bg-v2-primary px-6 py-3 font-v2-headline text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-v2-primary/90"
      >
        Upgrade Now
      </button>
    </section>
  );
}
