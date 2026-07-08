import { cn } from "@/lib/utils";

type ProfilePositionBadgeV2Props = {
  position: number | null | undefined;
  className?: string;
};

export function ProfilePositionBadgeV2({
  position,
  className,
}: ProfilePositionBadgeV2Props) {
  if (position == null) {
    return (
      <span
        className={cn(
          "text-[10px] font-bold uppercase text-v2-on-surface-variant",
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
          "inline-flex items-center justify-center rounded-v2-sm bg-v2-primary px-1.5 py-0.5 text-[9px] font-black uppercase text-white",
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
          "inline-flex items-center justify-center rounded-v2-sm bg-v2-surface-container-highest px-1.5 py-0.5 text-[9px] font-black uppercase text-white",
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
        "inline-block text-[10px] font-bold uppercase leading-none text-v2-on-surface-variant",
        className,
      )}
    >
      {label}
    </span>
  );
}
