import { getSimDisplayName, getSimBadgeClass } from "@/lib/sim";

interface SimBadgeProps {
  sim: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Renders a subtle badge indicating the sim/game for a session.
 * Consistent styling across the app.
 */
export default function SimBadge({ sim, size = "sm", className = "" }: SimBadgeProps) {
  if (!sim) return null;

  const displayName = getSimDisplayName(sim);
  const badgeClass = getSimBadgeClass(sim);

  const sizeClasses = size === "sm" 
    ? "px-1.5 py-0.5 text-[10px]" 
    : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded border font-medium tracking-wide ${badgeClass} ${sizeClasses} ${className}`}
    >
      {displayName}
    </span>
  );
}
