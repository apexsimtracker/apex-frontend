import { Brain } from "lucide-react";

type DashboardSessionApexPanelProps = {
  insight: string;
};

export default function DashboardSessionApexPanel({
  insight,
}: DashboardSessionApexPanelProps) {
  return (
    <div className="border-l-4 border-t border-apex-outline-variant/10 border-l-[#E10600] bg-apex-surface-container-high/40 p-5">
      <div className="mb-2 flex items-center gap-2">
        <Brain className="size-5 shrink-0 text-[#E10600]" aria-hidden />
        <h3 className="font-apex-headline text-sm font-bold tracking-wide text-apex-on-surface">
          Apex Analysis
        </h3>
      </div>
      <p className="font-apex-body text-sm leading-relaxed text-apex-on-surface">
        {insight}
      </p>
    </div>
  );
}
