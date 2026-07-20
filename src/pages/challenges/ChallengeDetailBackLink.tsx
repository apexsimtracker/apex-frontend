import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface ChallengeDetailBackLinkProps {
  challengeId: string;
}

export default function ChallengeDetailBackLink({
  challengeId,
}: ChallengeDetailBackLinkProps) {
  return (
    <Link
      to={`/challenge/${challengeId}`}
      className="inline-flex items-center gap-1.5 font-apex-body text-sm text-apex-on-surface-variant transition-colors hover:text-apex-on-surface"
    >
      <ChevronLeft className="size-4 shrink-0" aria-hidden />
      Challenge
    </Link>
  );
}
