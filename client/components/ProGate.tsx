import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, BarChart3 } from "lucide-react";
import { useAuth, useIsProUser } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

type ProFeature =
  | "agent"
  | "auto-upload"
  | "advanced-analytics"
  | "priority-support"
  | "lap-charts"
  | "sector-charts"
  | "delta-charts"
  | "position-charts";

const FEATURE_MESSAGES: Record<ProFeature, { title: string; subtitle: string }> = {
  agent: {
    title: "Apex Pro Required",
    subtitle: "Automatic telemetry uploads are part of Apex Pro.",
  },
  "auto-upload": {
    title: "Apex Pro Required",
    subtitle: "Automatic session uploads require Apex Pro.",
  },
  "advanced-analytics": {
    title: "Apex Pro Required",
    subtitle: "Advanced analytics and insights are part of Apex Pro.",
  },
  "priority-support": {
    title: "Apex Pro Required",
    subtitle: "Priority support is available with Apex Pro.",
  },
  "lap-charts": {
    title: "Apex Pro Required",
    subtitle: "Lap charts are part of Apex Pro.",
  },
  "sector-charts": {
    title: "Apex Pro Required",
    subtitle: "Sector analysis charts are part of Apex Pro.",
  },
  "delta-charts": {
    title: "Apex Pro Required",
    subtitle: "Delta comparison charts are part of Apex Pro.",
  },
  "position-charts": {
    title: "Apex Pro Required",
    subtitle: "Position history charts are part of Apex Pro.",
  },
};

interface ProGateProps {
  feature: ProFeature;
  children: ReactNode;
  fallback?: ReactNode;
}

function UpgradeCTA({ feature }: { feature: ProFeature }) {
  const { title, subtitle } = FEATURE_MESSAGES[feature] ?? FEATURE_MESSAGES.agent;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
          <Lock className="h-5 w-5 text-white/60" />
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/60">{subtitle}</p>
        <button
          type="button"
          disabled
          className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 cursor-not-allowed"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}

export default function ProGate({ feature, children, fallback }: ProGateProps) {
  const { loading } = useAuth();
  const isPro = useIsProUser();

  if (loading) {
    return null;
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <UpgradeCTA feature={feature} />;
}

export { useIsProUser };

interface ChartProGateProps {
  feature: ProFeature;
  className?: string;
}

export function ChartProGate({ feature, className = "" }: ChartProGateProps) {
  const navigate = useNavigate();
  const { title, subtitle } = FEATURE_MESSAGES[feature] ?? FEATURE_MESSAGES["lap-charts"];

  return (
    <div
      className={`rounded-lg border border-white/10 bg-white/[0.02] p-8 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
        <BarChart3 className="h-6 w-6 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/60 max-w-xs">{subtitle}</p>
      <Button
        onClick={() => navigate("/upgrade")}
        className="mt-6 bg-amber-500 text-black hover:bg-amber-400"
      >
        Upgrade
      </Button>
    </div>
  );
}

export type { ProFeature };
