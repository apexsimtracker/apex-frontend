import { Flag, Trophy, Gauge } from "lucide-react";

interface Goal {
  id: string;
  icon: React.ReactNode;
  current: number;
  target: number;
  label: string;
}

interface GoalsBarProps {
  races: number;
  podiums: number;
  laps: number;
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
  const progress = Math.min(current / target, 1);
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.16)"
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
          <span className="text-white font-normal">/{goal.target}</span>
        </div>
        <div className="text-[10px] text-white">{goal.label}</div>
      </div>
    </div>
  );
}

export default function GoalsBar({ races, podiums, laps }: GoalsBarProps) {
  const goals: Goal[] = [
    {
      id: "races",
      icon: <Flag className="w-5 h-5" />,
      current: races,
      target: 10,
      label: "Races",
    },
    {
      id: "podiums",
      icon: <Trophy className="w-5 h-5" />,
      current: podiums,
      target: 5,
      label: "Podiums",
    },
    {
      id: "laps",
      icon: <Gauge className="w-5 h-5" />,
      current: laps,
      target: 100,
      label: "Laps",
    },
  ];

  return (
    <div className="mt-6 rounded-lg border border-white/6 bg-card/20 backdrop-blur-lg px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-white uppercase tracking-wider">Weekly Goals</h2>
      </div>
      
      <div className="flex items-center justify-around">
        {goals.map((goal) => (
          <GoalItem key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
