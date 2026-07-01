import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const CHALLENGES_V2_PATH = "/v2/challenges";

export default function ChallengeDetailTopBarV2() {
  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-v2-outline-variant/15 bg-v2-background p-4">
      <Link
        to={CHALLENGES_V2_PATH}
        className="inline-flex items-center gap-2 text-sm text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        <span className="sr-only sm:not-sr-only">Back</span>
      </Link>
      <h1 className="flex-1 text-center font-v2-headline text-base font-bold tracking-tight text-v2-on-surface">
        Challenge
      </h1>
      <span className="w-[52px] shrink-0 sm:w-[72px]" aria-hidden />
    </div>
  );
}
