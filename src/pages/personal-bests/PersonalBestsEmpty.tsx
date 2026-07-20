import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { appPrimaryButtonClassName } from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";

type PersonalBestsEmptyProps = {
  className?: string;
};

export default function PersonalBestsEmpty({
  className,
}: PersonalBestsEmptyProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-low p-8 text-center sm:p-10",
        className,
      )}
    >
      <div className="mb-4 flex justify-center">
        <div className="rounded-full bg-apex-primary/10 p-3">
          <Trophy className="size-6 text-apex-primary" aria-hidden />
        </div>
      </div>
      <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface">
        No personal bests yet
      </h2>
      <p className="mt-2 font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
        Upload a qualifying session with sector data to start tracking PBs.
      </p>
      <Link
        to="/upload"
        className={cn(
          appPrimaryButtonClassName,
          "mt-6 inline-flex items-center justify-center px-6 py-2",
        )}
      >
        Upload session
      </Link>
    </section>
  );
}
