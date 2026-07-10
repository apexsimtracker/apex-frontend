import { PenLine } from "lucide-react";
import SimBadge from "@/components/SimBadge";
import SessionTypeTag from "@/components/SessionTypeTag";
import type { SessionDetail } from "@/features/session-detail/sessionDetailData";

type ResolvedSessionFields = {
  sim: string | null;
};

type SessionDetailBadgesV2Props = {
  session: SessionDetail;
  resolved: ResolvedSessionFields;
  isManual: boolean;
};

export default function SessionDetailBadgesV2({
  session,
  resolved,
  isManual,
}: SessionDetailBadgesV2Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SessionTypeTag
        sessionType={session.sessionType}
        manualSessionKind={session.manualSessionKind}
        size="md"
      />
      <SimBadge sim={resolved.sim ?? session.sim} />
      {isManual && (
        <span className="inline-flex items-center gap-1 rounded-v2-sm border border-v2-outline-variant/20 bg-v2-surface-container-high px-1.5 py-0.5 font-v2-body text-[10px] font-medium tracking-wide text-v2-on-surface-variant">
          <PenLine className="size-3" aria-hidden />
          Manual
        </span>
      )}
    </div>
  );
}
