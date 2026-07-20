import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { appPrimaryButtonClassName } from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";

type PersonalBestsProLockedProps = {
  className?: string;
};

export default function PersonalBestsProLocked({
  className,
}: PersonalBestsProLockedProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-apex-outline-variant/15 bg-gradient-to-b from-apex-surface-container to-apex-background p-8 text-center",
        className,
      )}
    >
      <div className="mb-4 flex justify-center">
        <div className="rounded-full bg-apex-primary/10 p-3">
          <Lock className="size-6 text-apex-primary" aria-hidden />
        </div>
      </div>
      <p className="font-apex-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-apex-on-surface-variant">
        Apex Pro feature
      </p>
      <h3 className="mt-2 font-apex-headline text-xl font-bold text-apex-on-surface">
        Apex Pro Required
      </h3>
      <p className="mb-6 mt-2 font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
        Personal bests tracking is an Apex Pro feature. Upgrade to save and view
        your best laps across every track and car combination.
      </p>
      <Link
        to="/pricing"
        className={cn(
          appPrimaryButtonClassName,
          "inline-flex items-center justify-center gap-2 text-xs tracking-wide",
        )}
      >
        <Sparkles className="size-4" aria-hidden />
        View Pro plans
      </Link>
    </section>
  );
}
