import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { v2PrimaryButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";

type PersonalBestsProLockedV2Props = {
  className?: string;
};

export default function PersonalBestsProLockedV2({
  className,
}: PersonalBestsProLockedV2Props) {
  return (
    <section
      className={cn(
        "rounded-xl border border-v2-outline-variant/15 bg-gradient-to-b from-v2-surface-container to-v2-background p-8 text-center",
        className,
      )}
    >
      <div className="mb-4 flex justify-center">
        <div className="rounded-full bg-v2-primary/10 p-3">
          <Lock className="size-6 text-v2-primary" aria-hidden />
        </div>
      </div>
      <p className="font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant">
        Apex Pro feature
      </p>
      <h3 className="mt-2 font-v2-headline text-xl font-bold text-v2-on-surface">
        Apex Pro Required
      </h3>
      <p className="mb-6 mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
        Personal bests tracking is an Apex Pro feature. Upgrade to save and view
        your best laps across every track and car combination.
      </p>
      <Link
        to="/v2/pricing"
        className={cn(
          v2PrimaryButtonClassName,
          "inline-flex items-center justify-center gap-2 text-xs tracking-wide",
        )}
      >
        <Sparkles className="size-4" aria-hidden />
        View Pro plans
      </Link>
    </section>
  );
}
