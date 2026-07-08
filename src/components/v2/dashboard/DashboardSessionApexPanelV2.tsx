import { Brain } from "lucide-react";

type DashboardSessionApexPanelV2Props = {
  insight: string;
};

export default function DashboardSessionApexPanelV2({
  insight,
}: DashboardSessionApexPanelV2Props) {
  return (
    <div className="border-l-4 border-t border-v2-outline-variant/10 border-l-[#E10600] bg-v2-surface-container-high/40 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Brain className="size-5 shrink-0 text-[#E10600]" aria-hidden />
        <h3 className="font-v2-headline text-sm font-bold tracking-wide text-v2-on-surface">
          Apex Analysis
        </h3>
      </div>
      <p className="font-v2-body text-sm leading-relaxed text-v2-on-surface">
        {insight}
      </p>
    </div>
  );
}
