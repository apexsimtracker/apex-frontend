import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface ChallengeDetailBackLinkV2Props {
  challengeId: string;
}

export default function ChallengeDetailBackLinkV2({
  challengeId,
}: ChallengeDetailBackLinkV2Props) {
  return (
    <Link
      to={`/v2/challenge/${challengeId}`}
      className="inline-flex items-center gap-1.5 font-v2-body text-sm text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
    >
      <ChevronLeft className="size-4 shrink-0" aria-hidden />
      Challenge
    </Link>
  );
}
