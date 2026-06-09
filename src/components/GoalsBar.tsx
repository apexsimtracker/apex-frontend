import { Flag, Trophy, Gauge } from "lucide-react";
import { SkeletonBlock } from "@/components/ui/skeleton";

interface Goal {
  id: string;
  icon: React.ReactNode;
  current: number;
  target: number;
  label: string;
}

const DEFAULT_RACES_TARGET = 10;
const DEFAULT_PODIUMS_TARGET = 5;
const DEFAULT_LAPS_TARGET = 100;

interface GoalsBarProps {
  races: number;
  podiums: number;
  laps: number;
  /** From profile weekly goal settings; defaults match server defaults. */
  racesTarget?: number;
  podiumsTarget?: number;
  lapsTarget?: number;
  /** When true, shows a placeholder while home weekly stats load. */
  loading?: boolean;
}

function CircularProgress({
  current,
  target,
  size = 56,
  strokeWidth = 5,
}: {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTarget = target > 0 ? target : 1;
  const progress = Math.min(current / safeTarget, 1);
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="white"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgb(240, 28, 28)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function GoalItem({ goal }: { goal: Goal }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Circular progress with icon */}
      <div className="relative">
        <CircularProgress current={goal.current} target={goal.target} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/50">
            {goal.icon}
          </div>
        </div>
      </div>
      
      {/* Value */}
      <div className="text-center">
        <div className="text-sm font-semibold">
          <span style={{ color: "rgb(240, 28, 28)" }}>{goal.current}</span>
          <span className="font-normal text-white">/{goal.target}</span>
        </div>
        <div className="text-[10px] text-white">{goal.label}</div>
      </div>
    </div>
  );
}

export default function GoalsBar({
  races,
  podiums,
  laps,
  racesTarget = DEFAULT_RACES_TARGET,
  podiumsTarget = DEFAULT_PODIUMS_TARGET,
  lapsTarget = DEFAULT_LAPS_TARGET,
  loading = false,
}: GoalsBarProps) {
  if (loading) {
    return (
      <div className="border-white/6 mt-6 rounded-lg border bg-card/20 px-4 py-3 backdrop-blur-lg">
        <SkeletonBlock height={14} width={112} className="mb-3 bg-white/10" rounded="sm" />
        <div className="flex items-center justify-around">
          {([0, 1, 2] as const).map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <SkeletonBlock height={56} width={56} rounded="full" className="bg-white/10" />
              <SkeletonBlock height={14} width={48} className="bg-white/10" rounded="sm" />
              <SkeletonBlock height={10} width={56} className="bg-white/10" rounded="sm" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const goals: Goal[] = [
    {
      id: "races",
      icon: <Flag className="size-5" />,
      current: races,
      target: racesTarget,
      label: "Races",
    },
    {
      id: "podiums",
      icon: <Trophy className="size-5" />,
      current: podiums,
      target: podiumsTarget,
      label: "Podiums",
    },
    {
      id: "laps",
      icon: <Gauge className="size-5" />,
      current: laps,
      target: lapsTarget,
      label: "Laps",
    },
  ];

  return (
    <div className="border-white/6 mt-6 rounded-lg border bg-card/20 px-4 py-3 backdrop-blur-lg">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-white">Weekly Goals</h2>
      </div>
      
      <div className="flex items-center justify-around">
        {goals.map((goal) => (
          <GoalItem key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
