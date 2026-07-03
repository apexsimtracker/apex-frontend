import { Link } from "react-router-dom";
import { ArrowLeft, MoreHorizontal } from "lucide-react";

const TEAM_V2_BACK_PATH = "/v2/community";

export default function TeamTopBarV2() {
  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 border-b border-v2-outline-variant/15 bg-v2-background p-4">
      <Link
        to={TEAM_V2_BACK_PATH}
        className="inline-flex size-9 items-center justify-center rounded-full bg-v2-surface-container-low text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
        aria-label="Back"
      >
        <ArrowLeft className="size-5 shrink-0" aria-hidden />
      </Link>
      <h1 className="flex-1 text-center font-v2-headline text-sm font-semibold tracking-tight text-v2-on-surface">
        Apex Racing
      </h1>
      {/* TODO(team-api): wire team options menu (edit, leave, report) once team backend exists. */}
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center rounded-full bg-v2-surface-container-low text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
        aria-label="Team options"
      >
        <MoreHorizontal className="size-5 shrink-0" aria-hidden />
      </button>
    </div>
  );
}
