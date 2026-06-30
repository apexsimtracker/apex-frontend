import { getSimDisplayName, getSimLogoSrc } from "@/lib/sim";
import { cn } from "@/lib/utils";

type SimLogoProps = {
  sim: string | null | undefined;
  className?: string;
  width?: number;
  height?: number;
};

/**
 * Brand-style sim logo from static `/sims/*.svg` assets.
 */
export function SimLogo({
  sim,
  className,
  width = 120,
  height = 32,
}: SimLogoProps) {
  const src = getSimLogoSrc(sim);
  if (!src) return null;
  const label = getSimDisplayName(sim);

  return (
    <img
      src={src}
      alt={`${label} logo`}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={cn(
        "h-7 w-auto max-w-[140px] shrink-0 select-none object-contain object-left",
        className,
      )}
    />
  );
}
