import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type AgentProUpgradeCardProps = {
  onUpgradeClick: () => void;
  className?: string;
};

export default function AgentProUpgradeCard({
  onUpgradeClick,
  className,
}: AgentProUpgradeCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[#2a2a2a] bg-gradient-to-b from-apex-surface-container to-apex-background p-6 text-center",
        className,
      )}
      data-purpose="upgrade-card"
    >
      <div className="mb-4 flex justify-center">
        <div className="rounded-full bg-apex-primary/10 p-3">
          <Lock className="size-6 text-apex-primary" aria-hidden />
        </div>
      </div>
      <h3 className="font-apex-headline text-xl font-bold text-apex-on-surface">
        Apex Pro Required
      </h3>
      <p className="mb-6 mt-2 text-sm text-apex-on-surface-variant">
        Automatic uploads are available with Apex Pro.
      </p>
      <button
        type="button"
        onClick={onUpgradeClick}
        className="w-full rounded-lg bg-apex-primary px-6 py-3 font-apex-headline text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-apex-primary/90"
      >
        Upgrade Now
      </button>
    </section>
  );
}
