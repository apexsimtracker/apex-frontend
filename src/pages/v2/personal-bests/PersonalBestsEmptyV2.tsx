import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { v2PrimaryButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";

type PersonalBestsEmptyV2Props = {
  className?: string;
};

export default function PersonalBestsEmptyV2({
  className,
}: PersonalBestsEmptyV2Props) {
  return (
    <section
      className={cn(
        "rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-8 text-center sm:p-10",
        className,
      )}
    >
      <div className="mb-4 flex justify-center">
        <div className="rounded-full bg-v2-primary/10 p-3">
          <Trophy className="size-6 text-v2-primary" aria-hidden />
        </div>
      </div>
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        No personal bests yet
      </h2>
      <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
        Upload a qualifying session with sector data to start tracking PBs.
      </p>
      <Link
        to="/v2/upload"
        className={cn(
          v2PrimaryButtonClassName,
          "mt-6 inline-flex items-center justify-center px-6 py-2",
        )}
      >
        Upload session
      </Link>
    </section>
  );
}
