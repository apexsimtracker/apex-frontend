import { cn } from "@/lib/utils";

type ProfilePositionBadgeProps = {
  position: number | null | undefined;
  className?: string;
};

export function ProfilePositionBadge({
  position,
  className,
}: ProfilePositionBadgeProps) {
  if (position == null) {
    return (
      <span
        className={cn(
          "text-[10px] font-bold uppercase text-apex-on-surface-variant",
          className,
        )}
      >
        —
      </span>
    );
  }

  const label = `P${position}`;

  if (position === 1) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-apex-sm bg-apex-primary px-1.5 py-0.5 text-[9px] font-black uppercase text-white",
          className,
        )}
      >
        {label}
      </span>
    );
  }

  if (position === 2) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-apex-sm bg-apex-surface-container-highest px-1.5 py-0.5 text-[9px] font-black uppercase text-white",
          className,
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-block text-[10px] font-bold uppercase leading-none text-apex-on-surface-variant",
        className,
      )}
    >
      {label}
    </span>
  );
}
